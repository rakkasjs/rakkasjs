/// <reference types="vite/client" />

import { RequestContext } from "../lib";
import { LayoutModule, PageModule } from "./page-types";
import React, { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import viteDevServer from "@vavite/expose-vite-dev-server/vite-dev-server";
import clientManifest from "virtual:rakkasjs:client-manifest";

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

		const modules = (await Promise.all(
			descriptors.map(([, importer]) => importer()),
		)) as [PageModule, ...LayoutModule[]];

		const content = modules.reduce(
			(prev, { default: Component }) => <Component children={prev} />,
			null as ReactNode,
		);

		const inner = renderToString(<>{content}</>);

		let scriptPath = "virtual:rakkasjs:client-entry";
		if (import.meta.env.PROD) {
			scriptPath = clientManifest![scriptPath]?.file ?? scriptPath;
		}

		let head = "";

		// Inject the names of modules
		const moduleNames = descriptors.map(
			([name]) => "/" + (clientManifest?.[name]?.file ?? name),
		);

		head += `<script>window.$RAKKAS_PAGE_MODULES=${safeStringify(
			moduleNames,
		)};</script>`;

		let html = `<!DOCTYPE html>
			<html>
				<head>${head}</head>
				<body>
					<div id="root">${inner}</div>
				</body>
				<script type="module" src=${safeStringify("/" + scriptPath)}></script>
			</html>`;

		if (import.meta.env.DEV) {
			html = await viteDevServer!.transformIndexHtml(ctx.url.pathname, html);
		}

		return new Response(html, {
			headers: { "Content-Type": "text/html; charset=utf-8" },
		});
	}

	return;
}

function safeStringify(obj: any): string {
	// TODO: Escape HTML
	return JSON.stringify(obj);
}
