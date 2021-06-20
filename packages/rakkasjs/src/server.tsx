import React from "react";
import { renderToString } from "react-dom/server";
import { ServerRouter } from "bare-routes";
import devalue from "devalue";
import { findEndpoint } from "./endpoints";
import { makeComponentStack } from "./makeComponentStack";
import { HelmetProvider, FilledContext } from "react-helmet-async";

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

export interface RakkasResponse {
	status?: number;
	headers?: Record<string, string>;
	body?: unknown;
}

export type RequestHandler = (
	request: RakkasRequest,
) => RakkasResponse | Promise<RakkasResponse>;

export type RakkasMiddleware = (
	request: RakkasRequest,
	next: RequestHandler,
) => RakkasResponse | Promise<RakkasResponse>;

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
	req: RawRequest,
	template: string,
	manifest?: Record<string, string[] | undefined>,
): Promise<RakkasResponse> {
	const found = findEndpoint(req);

	if (found) {
		let method = req.method.toLowerCase();
		if (method === "delete") method = "del";
		let handler: RequestHandler | undefined;

		const importer = found.stack[found.stack.length - 1] as EndpointImporter;
		const mdl = await importer();

		const leaf = mdl[method] || mdl.default;

		if (leaf) {
			const middleware = found.stack.slice(0, -1) as MiddlewareImporter[];

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

		reload() {
			throw new Error("Don't call reload on server side");
		},

		fetch: internalFetch,
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

	const helmetContext = {};

	const app = renderToString(
		<HelmetProvider context={helmetContext}>
			<ServerRouter url={req.url}>{foundPage.content}</ServerRouter>
		</HelmetProvider>,
	);

	const { helmet } = helmetContext as FilledContext;

	let head = `<script>__RAKKAS_RENDERED=(0,eval)(${devalue(
		foundPage.rendered.map((x) => {
			delete x.Component;
			return x;
		}),
	)})</script>`;

	head +=
		helmet.base.toString() +
		helmet.link.toString() +
		helmet.meta.toString() +
		helmet.noscript.toString() +
		helmet.script.toString() +
		helmet.style.toString() +
		helmet.title.toString();

	if (manifest) {
		for (const { name } of foundPage.rendered) {
			if (!name) continue;

			const assets = manifest[name];
			if (!assets) continue;

			for (const asset of assets) {
				if (asset.endsWith(".js")) {
					head += `\n<link rel="modulepreload" href=${JSON.stringify(asset)}>`;
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
		status: foundPage.status,
		headers: {
			"content-type": "text/html",
		},
		body,
	};
}
