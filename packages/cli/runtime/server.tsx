import React from "react";
import { renderToString } from "react-dom/server";

import { ServerRouter, RouteRenderArgs } from "@rakkasjs/core";

import { findAndRenderRoute } from "@rakkasjs:routes.tsx";

export async function renderServerSide(route: RouteRenderArgs) {
	const content = await findAndRenderRoute(route);
	return renderToString(<ServerRouter url={route.url}>{content}</ServerRouter>);
}
