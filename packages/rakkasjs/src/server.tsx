import React from "react";
import { renderToString } from "react-dom/server";
import {
	RakkasMiddleware,
	RakkasRequest,
	RakkasResponse,
	RequestHandler,
} from ".";
import { HelmetProvider, FilledContext } from "react-helmet-async";
import devalue from "devalue";

import { makeComponentStack } from "./lib/makeComponentStack";
import { findRoute, Route } from "./lib/find-route";

import importers from "@rakkasjs/api-imports";
import {
	RawRequest,
	PageRenderOptions,
	RakkasRequestBodyAndType,
} from "./lib/types";
import { KnaveServerSideProvider } from "knave-react";
import { ParamsContext } from "./lib/useRouter";

export type { Route };

export interface EndpointModule {
	[method: string]: RequestHandler | undefined;
}

export interface MiddlewareModule {
	default: RakkasMiddleware;
}

export type EndpointImporter = () => EndpointModule | Promise<EndpointModule>;
export type MiddlewareImporter = () =>
	| MiddlewareModule
	| Promise<MiddlewareModule>;

interface RequestContext {
	htmlTemplate: string;
	apiRoutes: Route[];
	pageRoutes: Route[];
	manifest?: Record<string, string[] | undefined>;
	request: RawRequest;
	writeFile?(name: string, content: string | Uint8Array): Promise<void>;
}

export async function handleRequest({
	htmlTemplate,
	apiRoutes,
	pageRoutes,
	manifest,
	request,
	writeFile,
}: RequestContext): Promise<RakkasResponse> {
	const path = decodeURI(request.url.pathname);

	const apiRoute = findRoute(path, apiRoutes);

	if (apiRoute) {
		let method = request.method.toLowerCase();
		if (method === "delete") method = "del";
		let handler: RequestHandler | undefined;

		const moduleId = apiRoute.stack[apiRoute.stack.length - 1];
		const module = await (import.meta.env.DEV
			? import(/* @vite-ignore */ moduleId)
			: importers[moduleId]());

		const leaf = module[method] || module.default;

		if (leaf) {
			const middleware = apiRoute.stack.slice(0, -1);
			handler = middleware.reduceRight((prev, cur) => {
				return async (req: RakkasRequest) => {
					const mdl = await (import.meta.env.DEV
						? import(/* @vite-ignore */ cur)
						: importers[cur]());

					return mdl.default ? mdl.default(req, prev) : prev(req);
				};
			}, leaf);

			return handler!({ ...request, params: apiRoute.params, context: {} });
		}
	}

	if (request.method !== "GET") {
		return {
			status: 404,
		};
	}

	async function internalFetch(
		input: RequestInfo,
		init?: RequestInit,
	): Promise<Response> {
		let url: string;
		let fullInit: Omit<RequestInit, "headers"> & { headers: Headers };
		if (input instanceof Request) {
			url = input.url;
			fullInit = {
				body: input.body,
				cache: input.cache,
				credentials: input.credentials,
				integrity: input.integrity,
				keepalive: input.keepalive,
				method: input.method,
				mode: input.mode,
				redirect: input.redirect,
				referrer: input.referrer,
				referrerPolicy: input.referrerPolicy,
				signal: input.signal,
				...init,
				headers: new Headers(init?.headers ?? input.headers),
			};
		} else {
			url = input;
			fullInit = {
				...init,
				headers: new Headers(init?.headers),
			};
		}

		const credentials = fullInit.credentials;
		delete fullInit.credentials;

		const parsed = new URL(url, request.url);

		if (parsed.origin === request.url.origin) {
			if (credentials !== "omit") {
				const cookie = request.headers.get("cookie");
				if (cookie !== null) {
					fullInit.headers.set("cookie", cookie);
				}

				const authorization = request.headers.get("authorization");
				if (!fullInit.headers.has("authorization") && authorization !== null) {
					fullInit.headers.set("authorization", authorization);
				}
			}

			const buf = await new Response(fullInit.body).arrayBuffer();

			try {
				const method = fullInit.method || "GET";

				const response = await handleRequest({
					htmlTemplate,
					apiRoutes,
					pageRoutes,
					request: {
						ip: request.ip,
						url: parsed,
						headers: fullInit.headers,
						method,
						originalIp: request.ip,
						originalUrl: parsed,
						...parseBody(new Uint8Array(buf), fullInit.headers),
					},
				});

				let body = response.body;

				if (typeof body !== "string" && !(body instanceof Uint8Array)) {
					body = JSON.stringify(body);
				}

				if (
					RAKKAS_BUILD_TARGET === "static" &&
					request.headers.get("x-rakkas-export") === "static" &&
					method === "GET"
				) {
					await writeFile!(`${parsed.pathname}`, body as string | Uint8Array);
				}

				return new Response(body as any, {
					status: response.status || 200,
					headers: response.headers as Record<string, string>,
				});
			} catch (error) {
				// TODO: Logging
				return new Response("Server error", { status: 500 });
			}
		}

		[
			"referer",
			"x-forwarded-for",
			"x-forwarded-host",
			"x-forwarded-proto",
			"x-forwarded-server",
		].forEach((header) => {
			if (request.headers.has(header)) {
				fullInit.headers.set(header, request.headers.get(header)!);
			}
		});

		if (request.headers.has("referer")) {
			fullInit.headers.set("referer", request.headers.get("referer")!);
		}

		if (
			!fullInit.headers.has("accept-language") &&
			request.headers.has("accept-language")
		) {
			fullInit.headers.set(
				"accept-language",
				request.headers.get("accept-language")!,
			);
		}

		return fetch(parsed.href, fullInit);
	}

	const foundPage = findRoute(
		decodeURI(request.url.pathname),
		pageRoutes,
		true,
	) || {
		stack: [],
		params: {},
		match: undefined,
	};

	const serverHooks = await import("@rakkasjs/server-hooks");
	const { servePage = (req, render) => render(req) } = serverHooks;

	let filename = request.url.pathname;
	if (filename === "/") filename = "";

	async function render(
		request: RawRequest,
		context: Record<string, unknown> = {},
		options: PageRenderOptions = {},
	): Promise<RakkasResponse> {
		const stack = await makeComponentStack({
			found: foundPage,

			url: request.url,

			reload() {
				throw new Error("Don't call reload on server side");
			},

			fetch: internalFetch,

			rootContext: context,

			helpers: options.createLoadHelpers
				? await options.createLoadHelpers(internalFetch)
				: {},
		});

		const helmetContext = {};

		let app = (
			<KnaveServerSideProvider url={request.url.href}>
				<ParamsContext.Provider value={{ params: foundPage.params }}>
					<HelmetProvider context={helmetContext}>
						{stack.content}
					</HelmetProvider>
				</ParamsContext.Provider>
			</KnaveServerSideProvider>
		);

		if (options.wrap) app = options.wrap(app);

		const rendered = options.renderToString
			? await options.renderToString(app)
			: renderToString(app);

		const { helmet } = helmetContext as FilledContext;

		const dataScript = `[(0,eval)(${devalue(context)}),(0,eval)(${devalue(
			stack.rendered.map((x) => {
				delete x.Component;
				return x;
			}),
		)})]`;

		let head = "";
		const headers: Record<string, string> = { "content-type": "text/html" };

		let location: string | undefined;
		const lastRendered = stack.rendered[stack.rendered.length - 1].loaded;

		if ("location" in lastRendered) {
			location = String(lastRendered.location);

			if (
				RAKKAS_BUILD_TARGET === "static" &&
				request.headers.get("x-rakkas-export") === "static"
			) {
				head += `<meta http-equiv="refresh" content="0; url=${encodeURI(
					location,
				)}">`;
			}

			headers.location = location;
		}

		head += `<script>[$rakkas$rootContext,$rakkas$rendered]=${dataScript}</script>`;

		if (pageRoutes) {
			head += `<script>$rakkas$routes=(0,eval)(${devalue(
				pageRoutes,
			)})</script>`;
		}

		head +=
			helmet.base.toString() +
			helmet.link.toString() +
			helmet.meta.toString() +
			helmet.noscript.toString() +
			helmet.script.toString() +
			helmet.style.toString() +
			helmet.title.toString();

		if (manifest) {
			const jsAssets = new Set<string>();
			const cssAssets = new Set<string>();

			for (const { name } of stack.rendered) {
				if (!name) continue;

				const assets = manifest[name];
				if (!assets) continue;

				for (const asset of assets) {
					if (asset.endsWith(".js")) {
						jsAssets.add(asset);
					} else if (asset.endsWith(".css")) {
						cssAssets.add(asset);
					}
				}
			}

			jsAssets.forEach(
				(asset) =>
					(head += `\n<link rel="modulepreload" href=${JSON.stringify(
						asset,
					)}>`),
			);
			cssAssets.forEach(
				(asset) =>
					(head += `\n<link rel="stylesheet" href=${JSON.stringify(asset)}>`),
			);
		}

		if (options.getHeadHtml) head += options.getHeadHtml();

		let html = htmlTemplate.replace("<!-- rakkas-head-placeholder -->", head);

		const htmlAttributes = helmet.htmlAttributes.toString();
		html = html.replace(
			"><!-- rakkas-html-attributes-placeholder -->",
			htmlAttributes ? " " + htmlAttributes + ">" : ">",
		);

		const bodyAttributes = helmet.bodyAttributes.toString();
		html = html.replace(
			"><!-- rakkas-body-attributes-placeholder -->",
			bodyAttributes ? " " + bodyAttributes + ">" : ">",
		);

		html = html.replace("<!-- rakkas-app-placeholder -->", rendered);

		if (
			RAKKAS_BUILD_TARGET === "static" &&
			request.headers.get("x-rakkas-export") === "static"
		) {
			await writeFile!(`${filename}/index.html`, html);
			headers["x-rakkas-export"] = "static";
		}

		return {
			status: stack.status,
			headers,
			body: html,
		};
	}

	return servePage(request, render);
}

function parseBody(
	bodyBuffer: Uint8Array,
	headers: Headers,
): RakkasRequestBodyAndType {
	if (!bodyBuffer || bodyBuffer.length === 0) {
		return { type: "empty" };
	}

	const [type] = (headers.get("content-type") || "").split(";");
	const isJson = type === "application/json" || type.endsWith("+json");
	const isUrlEncoded = type === "application/x-www-form-urlencoded";

	if (type.startsWith("text/") || isJson || isUrlEncoded) {
		let text: string;
		try {
			text = new TextDecoder("utf8").decode(bodyBuffer);
		} catch (error) {
			(error as any).status = 400;
			throw error;
		}

		if (isJson) {
			try {
				return { type: "json", body: JSON.parse(text) };
			} catch (error) {
				(error as any).status = 400;
				throw error;
			}
		} else if (isUrlEncoded) {
			return {
				type: "form-data",
				body: new URLSearchParams(text),
			};
		}

		return { type: "text", body: text };
	}

	return { type: "binary", body: new Uint8Array(bodyBuffer) };
}
