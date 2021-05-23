import React, { ComponentType } from "react";
import { renderToString } from "react-dom/server";

import { ServerRouter, RouteRenderArgs } from "bare-routes";
import devalue from "devalue";

import { findRoute } from "./pages";
import { findEndpoint } from "./endpoints";

const notFoundModuleImporter = () => ({
	default: () => <p>Not found</p>,
});

export interface RawRequest {
	url: URL;
	method: string;
}

export async function handleRequest(req: RawRequest) {
	console.log("Server-side:", req.url.pathname);

	const { importer: endpointImporter, params: endpointParams } =
		findEndpoint(req);

	if (endpointImporter) {
		const mdl = await endpointImporter();
		console.log("Module", mdl);
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

	const { params, stack } = findRoute(req.url.pathname, notFoundModuleImporter);

	const modules = await Promise.all(stack.map((importer) => importer()));
	const data: any[] = [];
	const components: ComponentType[] = [];
	for (const mdl of modules) {
		components.push(mdl.default);
		data.push((await mdl.load?.({ url: req.url, params }))?.props);
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
