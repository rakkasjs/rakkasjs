import React from "react";
import { renderToString } from "react-dom/server";
import {
	RakkasMiddleware,
	RakkasProvider,
	RakkasRequest,
	RakkasResponse,
	RequestHandler,
} from ".";
import { HelmetProvider, FilledContext } from "react-helmet-async";
import devalue from "devalue";

import { makeComponentStack } from "./lib/makeComponentStack";
import { findRoute, Route } from "./lib/find-route";

import importers from "@rakkasjs/api-imports";
import { RawRequest } from "./lib/types";

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

export async function handleRequest(
	apiRoutes: Route[],
	pageRoutes: Route[],
	{
		request,
		template,
		manifest,
		pages,
	}: {
		request: RawRequest;
		template: string;
		manifest?: Record<string, string[] | undefined>;
		pages?: Array<[RegExp, string, string]>;
	},
): Promise<RakkasResponse> {
	const path = decodeURI(request.url.pathname);

	const found = findRoute(path, apiRoutes);

	if (found) {
		let method = request.method.toLowerCase();
		if (method === "delete") method = "del";
		let handler: RequestHandler | undefined;

		const moduleId = found.stack[found.stack.length - 1];
		const module = await (import.meta.env.DEV
			? import(/* @vite-ignore */ moduleId)
			: importers[moduleId]());

		const leaf = module[method] || module.default;

		if (leaf) {
			const middleware = found.stack.slice(0, -1);
			handler = middleware.reduceRight((prev, cur) => {
				return async (req: RakkasRequest) => {
					const mdl = await (import.meta.env.DEV
						? import(/* @vite-ignore */ cur)
						: importers[cur]());
					return mdl.default(req, prev);
				};
			}, leaf);

			return handler!({ ...request, params: found.params, context: {} });
		}
	}

	if (request.method !== "GET") {
		return {
			status: 404,
		};
	}

	function internalFetch(
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

		const parsed = new URL(url, request.url);

		if (parsed.origin === request.url.origin) {
			if (fullInit.credentials !== "omit") {
				const cookie = request.headers.get("cookie");
				if (cookie !== null) {
					fullInit.headers.set("cookie", cookie);
				}

				const authorization = request.headers.get("authorization");
				if (!fullInit.headers.has("authorization") && authorization !== null) {
					fullInit.headers.set("authorization", authorization);
				}
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
	const { servePage = (req, render) => render(req, {}) } = serverHooks;

	async function render(
		request: RawRequest,
		context: Record<string, unknown>,
	): Promise<RakkasResponse> {
		const stack = await makeComponentStack({
			found: foundPage,

			url: request.url,

			reload() {
				throw new Error("Don't call reload on server side");
			},

			fetch: internalFetch,

			rootContext: context,
		});

		// Handle redirection
		if ("location" in stack) {
			return {
				status: stack.status,
				headers: { location: String(stack.location) },
			};
		}

		const helmetContext = {};

		const app = renderToString(
			<RakkasProvider
				value={{
					current: request.url,
					params: stack.params,
					setRootContext() {
						throw new Error("setRootContext() cannot be used on server side");
					},
				}}
			>
				<HelmetProvider context={helmetContext}>{stack.content}</HelmetProvider>
			</RakkasProvider>,
		);

		const { helmet } = helmetContext as FilledContext;

		let head = `<script>__RAKKAS_ROOT_CONTEXT=(0,eval)(${devalue(
			context,
		)})</script>`;

		head += `<script>__RAKKAS_RENDERED=(0,eval)(${devalue(
			stack.rendered.map((x) => {
				delete x.Component;
				return x;
			}),
		)})</script>`;

		if (pages) {
			head += `<script>__RAKKAS_ROUTES=(0,eval)(${devalue(pages)})</script>`;
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
			for (const { name } of stack.rendered) {
				if (!name) continue;

				const assets = manifest[name];
				if (!assets) continue;

				for (const asset of assets) {
					if (asset.endsWith(".js")) {
						head += `\n<link rel="modulepreload" href=${JSON.stringify(
							asset,
						)}>`;
					} else if (asset.endsWith(".css")) {
						head += `\n<link rel="stylesheet" href=${JSON.stringify(asset)}>`;
					} else {
						head += `\n<link rel="preload" href=${JSON.stringify(asset)}>`;
					}
				}
			}
		}

		let body = template.replace("<!-- rakkas-head-placeholder -->", head);

		const htmlAttributes = helmet.htmlAttributes.toString();
		body = body.replace(
			"><!-- rakkas-html-attributes-placeholder -->",
			htmlAttributes ? " " + htmlAttributes + ">" : ">",
		);

		const bodyAttributes = helmet.bodyAttributes.toString();
		body = body.replace(
			"><!-- rakkas-body-attributes-placeholder -->",
			bodyAttributes ? " " + bodyAttributes + ">" : ">",
		);

		body = body.replace("<!-- rakkas-app-placeholder -->", app);

		return {
			status: stack.status,
			headers: { "content-type": "text/html" },
			body,
		};
	}

	return servePage(request, render);
}
