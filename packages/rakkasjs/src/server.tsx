import React from "react";
import { renderToString } from "react-dom/server";
import {
	RakkasMiddleware,
	RakkasRequest,
	RakkasResponse,
	RequestHandler,
} from ".";
import { HelmetProvider, FilledContext, Helmet } from "react-helmet-async";
import devalue from "devalue";

import { makeComponentStack } from "./lib/makeComponentStack";
import { findRoute, Route } from "./lib/find-route";

import importers from "virtual:rakkasjs:api-imports";
import * as commonHooks from "virtual:rakkasjs:common-hooks";
import {
	RawRequest,
	PageRenderOptions,
	RakkasRequestBodyAndType,
	CommonHooks,
	ServePageHook,
} from "./lib/types";
import { KnaveServerSideProvider } from "knave-react";
import { ParamsContext } from "./lib/useRouter";
import { selectLocale } from "./lib/selectLocale";
import { LocaleContext } from "./lib/useLocale";

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

export interface CachedResponse {
	response: RakkasResponse;
	expired: false;
}

export interface RakkasServerResponse extends RakkasResponse {
	waitUntil?: Promise<any>;
}

const pendingResponses: Record<string, Promise<RakkasResponse> | undefined> =
	{};

interface RequestContext {
	htmlTemplate: string;
	htmlPlaceholder: string;
	apiRoutes: Route[];
	pageRoutes: Route[];
	manifest?: Record<string, string[] | undefined>;
	request: RawRequest;
	getCachedResponse?(path: string): Promise<CachedResponse | undefined>;
	saveResponse?(path: string, response: RakkasResponse): Promise<void>;
	prerendering?: boolean;
}

export async function handleRequest(
	context: RequestContext,
): Promise<RakkasServerResponse> {
	const path = decodeURI(context.request.url.pathname);

	const cached = await context.getCachedResponse?.(path);

	if (cached) {
		if (cached.expired && !pendingResponses[path]) {
			pendingResponses[path] = generateResponse(path, context).finally(() => {
				delete pendingResponses[path];
			});
		}

		return {
			...cached.response,
			waitUntil: pendingResponses[path],
		};
	}

	return generateResponse(path, context);
}

export async function generateResponse(
	path: string,
	{
		htmlTemplate,
		htmlPlaceholder,
		apiRoutes,
		pageRoutes,
		manifest,
		request,
		getCachedResponse,
		saveResponse,
		prerendering,
	}: RequestContext,
): Promise<RakkasResponse> {
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

			const response = await handler!({
				...request,
				params: apiRoute.params,
				context: {},
			});

			response.status = response.status || (method === "post" ? 201 : 200);

			if (
				prerendering &&
				method === "get" &&
				!(response.body instanceof Uint8Array) &&
				saveResponse &&
				(response.prerender ??
					(RAKKAS_BUILD_TARGET === "static" && response.status !== 404))
			) {
				await saveResponse(path, response);
			}

			return response;
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
					htmlPlaceholder,
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
					manifest,
					getCachedResponse,
					saveResponse,
					prerendering,
				});

				let body = response.body;

				if (typeof body !== "string" && !(body instanceof Uint8Array)) {
					body = JSON.stringify(body);
				}

				return new Response(body as any, {
					status: response.status || (method === "POST" ? 201 : 200),
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

	let locale = RAKKAS_DEFAULT_LOCALE;

	function detectLanguage(available: string[]): string {
		if (prerendering || !RAKKAS_DETECT_LOCALE) {
			return RAKKAS_DEFAULT_LOCALE;
		}

		let fromCookie: string | undefined;
		if (RAKKAS_LOCALE_COOKIE_NAME) {
			const cookie = request.headers.get("cookie");

			if (cookie) {
				const match = cookie.match(
					new RegExp(`(?:^|;)\\s*${RAKKAS_LOCALE_COOKIE_NAME}=([^;]+)`),
				);

				if (match !== null) {
					fromCookie = match[1];
				}
			}
		}

		const languages = (request.headers.get("accept-language") || "")
			.split(",")
			.filter(Boolean)
			.map((v) => {
				const [lang, ...specs] = v.split(";");
				const q = Number(
					specs
						.map((x) => x.trim())
						.find((s) => s.startsWith("q="))
						?.slice(2),
				);

				if (isNaN(q)) {
					return { lang, q: 1 };
				}

				return { lang, q };
			})
			.sort((a, b) => b.q - a.q)
			.map((x) => x.lang);

		return selectLocale(
			fromCookie ? [fromCookie, ...languages] : languages,
			available,
		);
	}

	let filename = request.url.pathname;
	if (filename === "/") filename = "";

	const extractLocale = (commonHooks.default as CommonHooks)?.extractLocale;

	if (extractLocale) {
		const result: any = extractLocale(request.url);

		if (RAKKAS_DETECT_LOCALE && result.redirect) {
			if (prerendering) {
				return {
					status: 300,
					headers: { "x-rakkas-prerender": "language-redirect" },
					body: result.redirect,
				};
			} else {
				const lang = detectLanguage(Object.keys(result.redirect));

				return {
					status: 302,
					headers: {
						location: String(result.redirect[lang]),
						vary: "accept-language",
					},
				};
			}
		} else {
			locale = result.locale;
			request.url = result.url ? new URL(result.url, request.url) : request.url;
		}
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

	const serverHooks = await import("virtual:rakkasjs:server-hooks");
	const { servePage = (req, render) => render(req) } = serverHooks as {
		servePage: ServePageHook | undefined;
	};

	async function render(
		request: RawRequest,
		context: any = {},
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

			locale,

			helpers: options.createLoadHelpers
				? await options.createLoadHelpers(internalFetch)
				: {},
		});

		if (!stack) {
			const html = htmlPlaceholder.replace(
				"<!-- rakkas-context-placeholder -->",
				`<script>$rakkas$rootContext=${devalue(context)}</script>`,
			);

			const response = {
				body: html,
				headers: { "content-type": "text/html", "content-language": locale },
			};

			if (RAKKAS_BUILD_TARGET === "static" && prerendering && saveResponse) {
				await saveResponse(`${filename}/index.html`, response);
			}

			return response;
		}

		if ("location" in stack) {
			const response = {
				status: stack.status,
				headers: {
					location: stack.location,
					"cache-control": stack.cacheControl,
				},
				// Insert HTML redirection if pre-rendering
				body: prerendering
					? `<html><head><meta http-equiv="refresh" content="0; url=${escapeHtml(
							stack.location,
					  )}"></head></html>`
					: null,
			};

			if (prerendering && saveResponse) {
				await saveResponse(`${filename}/index.html`, response);
			}

			return response;
		}

		const helmetContext = {};

		let app = (
			<KnaveServerSideProvider url={request.url.href}>
				<HelmetProvider context={helmetContext}>
					<ParamsContext.Provider value={{ params: foundPage.params }}>
						<LocaleContext.Provider value={locale}>
							{stack.content}
							<Helmet htmlAttributes={{ lang: locale }} />
						</LocaleContext.Provider>
					</ParamsContext.Provider>
				</HelmetProvider>
			</KnaveServerSideProvider>
		);

		if (options.wrap) app = options.wrap(app);

		const rendered = options.renderToString
			? await options.renderToString(app)
			: renderToString(app);

		const { helmet } = helmetContext as FilledContext;

		const dataScript = `[${devalue(context)},${devalue(
			stack.rendered.map((x) => {
				delete x.Component;
				return x;
			}),
		)}]`;

		let head = "";
		const headers: Record<string, string> = { "content-type": "text/html" };

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

		if (prerendering && !stack.crawl) {
			headers["x-rakkas-prerender"] = "no-crawl";
		}

		if (stack.cacheControl) headers["cache-control"] = stack.cacheControl;

		const response = {
			status: stack.status,
			headers,
			body: html,
		};

		if (prerendering && stack.prerender && saveResponse) {
			await saveResponse(`${filename}/index.html`, response);
		}

		return response;
	}

	return servePage(request, render, locale);
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

/** Escape HTML */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
