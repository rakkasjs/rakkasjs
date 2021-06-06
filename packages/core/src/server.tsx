import React from "react";
import { renderToString } from "react-dom/server";
import { ServerRouter } from "bare-routes";
import devalue from "devalue";

import { findEndpoint } from "./endpoints";

import nodeFetch, {
	Response as NodeFetchResponse,
	Request as NodeFetchRequest,
	Headers as NodeFetchHeaders,
	// @ts-expect-error: There's a problem with node-fetch typings
} from "node-fetch";
import { RakkasResponse } from "./types";
import { makeComponentStack } from "./makeComponentStack";

globalThis.fetch = nodeFetch;
globalThis.Response = NodeFetchResponse;
globalThis.Request = NodeFetchRequest;
globalThis.Headers = NodeFetchHeaders;

export interface RawRequest {
	url: URL;
	method: string;
	headers: Headers;
}

export interface RakkasRequest {
	url: URL;
	method: string;
	headers: Headers;
	params: Record<string, string>;
	rawBody: string | Uint8Array;
}

export async function handleRequest(
	req: RawRequest,
	template: string,
): Promise<RakkasResponse> {
	const endpoint = findEndpoint(req);

	if (endpoint) {
		const { importer: endpointImporter, params: endpointParams } = endpoint;
		const mdl = await endpointImporter();
		const handler = mdl[req.method.toLowerCase()];
		if (handler) {
			const response = await handler({
				...req,
				params: endpointParams,
			});

			return response;
		}
	}

	const stack = await makeComponentStack({
		url: req.url,
		previousRender: {
			components: [],
			isDataValid: [],
			data: [],
		},

		reload() {
			throw new Error("Don't call reload on server side");
		},

		fetch(input: RequestInfo, init?: RequestInit): Promise<NodeFetchResponse> {
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
					if (
						!fullInit.headers.has("authorization") &&
						authorization !== null
					) {
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

			return nodeFetch(parsed.href, fullInit);
		},
	});

	// Handle redirection
	if ("location" in stack) {
		return {
			status: stack.status,
			headers: {
				location: String(stack.location),
			},
		};
	}

	const app = renderToString(
		<ServerRouter url={req.url}>{stack.content}</ServerRouter>,
	);

	let body = template.replace(
		"<!-- rakkas-data-placeholder -->",
		devalue(stack.data),
	);
	body = body.replace("<!-- rakkas-app-placeholder -->", app);

	return {
		status: stack.status,
		headers: {
			"content-type": "text/html",
		},
		body,
	};
}
