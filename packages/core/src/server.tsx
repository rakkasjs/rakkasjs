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
						const url = typeof input === "string" ? input : input.url;
						const parsed = new URL(url, req.url);

						if (parsed.origin === req.url.origin) {
							// TODO: Handle internal fetch
						}

						return nodeFetch(
							typeof input === "string"
								? parsed.href
								: { ...input, url: parsed.href },
							init,
						);
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
