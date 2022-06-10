import React, { ReactElement, StrictMode, Suspense } from "react";
import { hydrateRoot } from "react-dom/client";
import { DEFAULT_QUERY_OPTIONS } from "../features/use-query/implementation";
import { UseQueryOptions } from "../lib";
import { App, loadRoute, RouteContext } from "./App";
import featureHooks from "./feature-client-hooks";

export interface StartClientOptions {
	defaultQueryOptions?: UseQueryOptions;
	onRender?: (app: ReactElement) => ReactElement;
}

export async function startClient(options: StartClientOptions = {}) {
	Object.assign(DEFAULT_QUERY_OPTIONS, options.defaultQueryOptions);

	const clientHooks = featureHooks;

	for (const hooks of clientHooks) {
		if (hooks.onBeforeStart) {
			await hooks.onBeforeStart();
		}
	}

	const route = await loadRoute(new URL(window.location.href));

	let app = <App />;

	if (options.onRender) {
		app = options.onRender(app);
	}

	for (const hooks of clientHooks) {
		if (hooks.onRender) {
			app = hooks.onRender(app);
		}
	}

	app = (
		<StrictMode>
			<RouteContext.Provider value={{ last: route }}>
				<Suspense>{app}</Suspense>
			</RouteContext.Provider>
		</StrictMode>
	);

	hydrateRoot(document.getElementById("root")!, app);
}

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
