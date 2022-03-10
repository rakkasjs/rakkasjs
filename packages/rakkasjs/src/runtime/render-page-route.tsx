import { RequestContext } from "../lib";
import { LayoutModule, PageModule } from "./page-types";
import React, { ReactNode } from "react";
import { renderToString } from "react-dom/server";

export async function renderPageRoute(
	req: Request,
	ctx: RequestContext<Record<string, string>>,
): Promise<Response | undefined> {
	ctx.locals = {};

	const pageRoutes = await import("virtual:rakkasjs:server-page-routes");

	for (const [regex, descriptors] of pageRoutes.default) {
		const match = regex.exec(ctx.url.pathname);
		if (!match) continue;

		ctx.params = match.groups || {};

		// const moduleNames = descriptors.map(([name]) => name);

		const modules = (await Promise.all(
			descriptors.map(([, importer]) => importer()),
		)) as [PageModule, ...LayoutModule[]];

		const content = modules.reduce(
			(prev, { default: Component }) => <Component children={prev} />,
			null as ReactNode,
		);

		const inner = renderToString(<>{content}</>);

		return new Response(inner, {
			headers: { "Content-Type": "text/html; charset=utf-8" },
		});
	}

	return;
}
