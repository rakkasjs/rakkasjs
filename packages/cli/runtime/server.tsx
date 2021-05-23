import React from "react";
import { renderToString } from "react-dom/server";

import { ServerRouter, RouteRenderArgs, devalue } from "@rakkasjs/core";

import { findAndRenderRoute } from "@rakkasjs:routes.tsx";

export async function renderServerSide(route: RouteRenderArgs) {
	const out = await findAndRenderRoute(route);

	const content = out.stack.reduceRight(
		(prev, cur) =>
			React.createElement(
				cur.component,
				{ ...cur.props, params: out.params, url: route.url },
				prev,
			),
		null as React.ReactNode,
	);

	const app = renderToString(
		<ServerRouter url={route.url}>{content}</ServerRouter>,
	);

	return {
		data: devalue(out.stack.map((x) => x.props)),
		app,
	};
}
