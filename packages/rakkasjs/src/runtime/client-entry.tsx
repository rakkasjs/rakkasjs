import React, { StrictMode, Suspense } from "react";
import { hydrateRoot } from "react-dom/client";
import { DEFAULT_QUERY_OPTIONS } from "../features/use-query/implementation";
import { UseQueryOptions, QueryContext, ErrorBoundary } from "../lib";
import { App, loadRoute, RouteContext } from "./App";
import { ClientHooks } from "./client-hooks";
import featureHooks from "./feature-client-hooks";
import { IsomorphicContext } from "./isomorphic-context";
import ErrorComponent from "virtual:rakkasjs:error-page";

export interface StartClientOptions {
	defaultQueryOptions?: UseQueryOptions;
	hooks?: ClientHooks;
}

export async function startClient(options: StartClientOptions = {}) {
	Object.assign(DEFAULT_QUERY_OPTIONS, options.defaultQueryOptions);

	const clientHooks = options.hooks
		? [...featureHooks, options.hooks]
		: featureHooks;

	for (const hooks of clientHooks) {
		if (hooks.beforeStart) {
			await hooks.beforeStart();
		}
	}

	const queryContext: QueryContext = {} as any;
	for (const hooks of clientHooks) {
		hooks.augmentQueryContext?.(queryContext);
	}

	let app = (
		<IsomorphicContext.Provider value={queryContext}>
			<App />
		</IsomorphicContext.Provider>
	);

	const reverseHooks = [...clientHooks].reverse();
	for (const hooks of reverseHooks) {
		if (hooks.wrapApp) {
			app = hooks.wrapApp(app);
		}
	}

	const route = await loadRoute(new URL(window.location.href), undefined, true);

	app = (
		<StrictMode>
			<RouteContext.Provider value={{ last: route }}>
				<Suspense>
					<ErrorBoundary FallbackComponent={ErrorComponent}>
						{app}
					</ErrorBoundary>
				</Suspense>
			</RouteContext.Provider>
		</StrictMode>
	);

	hydrateRoot(document.getElementById("root")!, app);
}
