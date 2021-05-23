import React, { ComponentType } from "react";
import { renderToString } from "react-dom/server";

import { ServerRouter, RouteRenderArgs } from "bare-routes";
import devalue from "devalue";

import { findRoute } from "./routes";

const notFoundModuleImporter = () => ({
	default: () => <p>Not found</p>,
});

export async function renderServerSide(route: RouteRenderArgs) {
	const { params, stack } = await findRoute(
		route.url.pathname,
		notFoundModuleImporter,
	);

	const modules = await Promise.all(stack.map((importer) => importer()));
	const data: any[] = [];
	const components: ComponentType[] = [];
	for (const mdl of modules) {
		components.push(mdl.default);
		data.push((await mdl.load?.({ url: route.url, params }))?.props);
	}

	const content = components.reduceRight(
		(prev, cur, i) =>
			React.createElement(cur, { ...data[i], params, url: route.url }, prev),
		null as React.ReactNode,
	);

	const app = renderToString(
		<ServerRouter url={route.url}>{content}</ServerRouter>,
	);

	return {
		data: devalue(data),
		app,
	};
}
