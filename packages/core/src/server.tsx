import React, { ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { ServerRouter } from "bare-routes";
import devalue from "devalue";

import { findPage } from "./pages";
import { findEndpoint } from "./endpoints";

import nodeFetch, {
	Response as NodeFetchResponse,
	Request as NodeFetchRequest,
	Headers as NodeFetchHeaders,
	// @ts-ignore
} from "node-fetch";

globalThis.fetch = nodeFetch;
globalThis.Response = NodeFetchResponse;
globalThis.Request = NodeFetchRequest;
globalThis.Headers = NodeFetchHeaders;

const notFoundModuleImporter = () => ({
	default: () => <p>Not found</p>,
});

export interface RawRequest {
	url: URL;
	method: string;
	headers: Headers;
}

interface RakkasRequest {
	url: URL;
	method: string;
	headers: Headers;
	params: Record<string, string>;
	rawBody: string | Uint8Array;
}

export async function handleRequest(req: RawRequest) {
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

			return {
				type: "endpoint",
				...response,
			};
		}
	}

	const { params, stack } = findPage(req.url.pathname, notFoundModuleImporter);

	const modules = await Promise.all(stack.map((importer) => importer()));
	const data: any[] = [];
	const components: ComponentType[] = [];
	for (const mdl of modules) {
		components.push(mdl.default);
		data.push(
			(
				await mdl.load?.({
					url: req.url,
					params,
					fetch(
						input: RequestInfo,
						init?: RequestInit,
					): Promise<NodeFetchResponse> {
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
				})
			)?.props,
		);
	}

	const content = components.reduceRight(
		(prev, cur, i) =>
			React.createElement(cur, { ...data[i], params, url: req.url }, prev),
		null as React.ReactNode,
	);

	const app = renderToString(
		<ServerRouter url={req.url}>{content}</ServerRouter>,
	);

	return {
		type: "page",
		data: devalue(data),
		app,
	};
}
