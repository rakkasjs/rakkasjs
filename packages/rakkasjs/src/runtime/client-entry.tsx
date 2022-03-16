/// <reference types="react/next" />
/// <reference types="react-dom/next" />

import React, { ReactElement, ReactNode, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";

import { ClientHooksModule } from "./client-hooks";
import * as reactHelmetAsyncHooks from "./builtin-client-hooks/react-helmet-async";
import * as useQueryAsyncHooks from "./builtin-client-hooks/use-query";
import { findRoute } from "./find-route";
import { LayoutModule } from "./page-types";

const hookModules: ClientHooksModule[] = [
	useQueryAsyncHooks,
	reactHelmetAsyncHooks,
];

export async function go() {
	throw new Error("Not implemented");
}

async function startClient() {
	const clientPageRoutes = await import("virtual:rakkasjs:client-page-routes");
	const found = findRoute(clientPageRoutes.default, window.location.pathname);
	if (!found) return;

	const importers = found.route[1];

	const promises = importers.map((importer) =>
		importer(),
	) as Promise<LayoutModule>[];

	const modules = await Promise.all(promises);

	const components = modules.map(
		(m) => m.default || (({ children }: any) => children),
	);

	const url = new URL(window.location.href);

	let app: ReactNode = components.reduce(
		(prev, Component) => (
			<Component children={prev} url={url} params={found.params} />
		),
		null as any as ReactElement,
	);

	for (const hooks of hookModules) {
		if (hooks.wrapApp) {
			app = hooks.wrapApp(app);
		}
	}

	hydrateRoot(document.getElementById("root")!, <StrictMode>{app}</StrictMode>);
}

startClient();

/*

const routes = await import("virtual:rakkasjs:client-page-routes");
const path = location.pathname;

// let params: Record<string, string>;
const route = routes.default.find(([re]) => {
	const match = path.match(re);
	if (match) {
		// params = match.groups || {};
		return true;
	}

	return false;
});

if (!route) {
	// TODO: Handle 404
	return;
}

modules = (await Promise.all(
	route[1].map((importer) => importer()),
)) as any;

*/
