import React, { StrictMode, Suspense } from "react";
import { hydrateRoot } from "react-dom/client";
import { App, RouteContext } from "./App";
import clientHooks from "./feature-client-hooks";

export async function go() {
	throw new Error("Not implemented");
}

async function startClient() {
	for (const hooks of clientHooks) {
		if (hooks.beforeInitialize) {
			await hooks.beforeInitialize();
		}
	}

	let app = (
		<RouteContext.Provider value={{}}>
			<Suspense fallback={null}>
				<App />
			</Suspense>
		</RouteContext.Provider>
	);

	for (const hooks of clientHooks) {
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
