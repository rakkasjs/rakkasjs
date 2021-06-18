import React from "react";
import { renderToString } from "react-dom/server";
import { ServerRouter } from "bare-routes";
import devalue from "devalue";
import { findEndpoint } from "./endpoints";
import { makeComponentStack } from "./makeComponentStack";
import { HeadContext, HeadContent } from "./HeadContext";
import { escapeHTML } from "./Head";

export interface RakkasResponse {
	status?: number;
	headers?: Record<string, string>;
	body?: unknown;
}

export interface RawRequest {
	url: URL;
	method: string;
	headers: Headers;
	body: Uint8Array | string | any;
}

export interface RakkasRequest {
	url: URL;
	method: string;
	headers: Headers;
	params: Record<string, string>;
	body: Uint8Array | string | any;
	context: Record<string, unknown>;
}

export type RequestHandler = (
	request: RakkasRequest,
) => RakkasResponse | Promise<RakkasResponse>;

export type Middleware = (
	request: RakkasRequest,
	next: RequestHandler,
) => RakkasResponse | Promise<RakkasResponse>;

export interface EndpointModule {
	[method: string]: RequestHandler | undefined;
}

export interface MiddlewareModule {
	default: Middleware;
}

console.log("env", import.meta.env);

export async function handleRequest(
	req: RawRequest,
	template: string,
): Promise<RakkasResponse> {
	const found = findEndpoint(req);

	if (found) {
		let method = req.method.toLowerCase();
		if (method === "delete") method = "del";
		let handler: RequestHandler | undefined;

		const endpointModule = (await found.stack[
			found.stack.length - 1
		]()) as EndpointModule;

		const leaf = endpointModule[method] || endpointModule.default;

		if (leaf) {
			const middleware = found.stack.slice(0, -1) as Array<
				() => Promise<MiddlewareModule>
			>;

			handler = middleware.reduceRight((prev, cur) => {
				return async (req: RakkasRequest) => {
					const mdl = await cur();
					return mdl.default(req, prev);
				};
			}, leaf);

			return handler({ ...req, params: found.params, context: {} });
		}
	}

	if (req.method !== "GET") {
		return {
			status: 404,
		};
	}

	function myFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
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

		const parsed = new URL(url, req.url);

		if (parsed.origin === req.url.origin) {
			if (fullInit.credentials !== "omit") {
				const cookie = req.headers.get("cookie");
				if (cookie !== null) {
					fullInit.headers.set("cookie", cookie);
				}

				const authorization = req.headers.get("authorization");
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
			if (req.headers.has(header)) {
				fullInit.headers.set(header, req.headers.get(header)!);
			}
		});

		if (req.headers.has("referer")) {
			fullInit.headers.set("referer", req.headers.get("referer")!);
		}

		if (
			!fullInit.headers.has("accept-language") &&
			req.headers.has("accept-language")
		) {
			fullInit.headers.set(
				"accept-language",
				req.headers.get("accept-language")!,
			);
		}

		return fetch(parsed.href, fullInit);
	}

	const foundPage = await makeComponentStack({
		url: req.url,
		previousRender: {
			components: [],
			isDataValid: [],
			data: [],
			contexts: [],
		},

		reload() {
			throw new Error("Don't call reload on server side");
		},

		fetch: myFetch,
	});

	// Handle redirection
	if ("location" in foundPage) {
		return {
			status: foundPage.status,
			headers: {
				location: String(foundPage.location),
			},
		};
	}

	const headContent: HeadContent = { title: "Rakkas App" };

	const app = renderToString(
		<HeadContext.Provider value={headContent}>
			<ServerRouter url={req.url}>{foundPage.content}</ServerRouter>
		</HeadContext.Provider>,
	);

	let head = `<script>__RAKKAS_INITIAL_DATA=${devalue(
		foundPage.data,
	)};__RAKKAS_INITIAL_CONTEXT=${devalue(foundPage.contexts)}</script>`;

	if (headContent.title) {
		head += `<title data-rakkas-head>${escapeHTML(headContent.title)}</title>`;
	}

	let body = template.replace("<!-- rakkas-head-placeholder -->", head);

	body = body.replace("<!-- rakkas-app-placeholder -->", app);

	return {
		status: foundPage.status,
		headers: {
			"content-type": "text/html",
		},
		body,
	};
}
