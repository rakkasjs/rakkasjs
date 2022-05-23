/// <reference types="react/next" />
/// <reference types="react-dom/next" />

import React, { StrictMode, Suspense } from "react";
import { hydrateRoot } from "react-dom/client";
import { ClientHooksModule } from "./client-hooks";
import { App, RouteContext } from "./App";
import {
	initialize,
	LocationContext,
} from "../features/client-side-navigation/implementation";

import * as reactHelmetAsyncHooks from "../features/head/client-hooks";
import * as useQueryHooks from "../features/use-query/client-hooks";
import * as clientSideHooks from "./builtin-client-hooks/client-side";

const hookModules: ClientHooksModule[] = [
	useQueryHooks,
	reactHelmetAsyncHooks,
	clientSideHooks,
];

export async function go() {
	throw new Error("Not implemented");
}

async function startClient() {
	initialize();

	let app = (
		<LocationContext.Provider value={location.href}>
			<RouteContext.Provider value={{}}>
				<Suspense fallback={null}>
					<App />
				</Suspense>
			</RouteContext.Provider>
		</LocationContext.Provider>
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
