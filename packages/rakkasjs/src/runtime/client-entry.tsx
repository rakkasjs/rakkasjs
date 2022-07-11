import React, { StrictMode, Suspense } from "react";
import { hydrateRoot } from "react-dom/client";
import { DEFAULT_QUERY_OPTIONS } from "../features/use-query/implementation";
import {
	UseQueryOptions,
	PageContext,
	ErrorBoundary,
	BeforeRouteResult,
} from "../lib";
import { App, loadRoute, RouteContext } from "./App";
import { ClientHooks } from "./client-hooks";
import featureHooks from "./feature-client-hooks";
import { IsomorphicContext } from "./isomorphic-context";
import ErrorComponent from "virtual:rakkasjs:error-page";
import commonHooks from "virtual:rakkasjs:common-hooks";

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

	const pageContext: PageContext = {
		url: new URL(window.location.href),
	} as any;
	for (const hooks of clientHooks) {
		hooks.extendPageContext?.(pageContext);
	}
	commonHooks.extendPageContext?.(pageContext);

	const beforeRouteHandlers: Array<
		(ctx: PageContext, url: URL) => BeforeRouteResult
	> = [
		...clientHooks.map((hook) => hook.beforeRoute),
		commonHooks.beforeRoute,
	].filter(Boolean) as any;

	let app = (
		<IsomorphicContext.Provider value={pageContext}>
			<App beforeRouteHandlers={beforeRouteHandlers} />
		</IsomorphicContext.Provider>
	);

	const reverseHooks = [...clientHooks].reverse();
	for (const hooks of reverseHooks) {
		if (hooks.wrapApp) {
			app = hooks.wrapApp(app);
		}
	}

	if (commonHooks.wrapApp) {
		app = commonHooks.wrapApp(app);
	}

	const route = await loadRoute(
		pageContext,
		undefined,
		true,
		beforeRouteHandlers,
	).catch((error) => {
		return { error };
	});

	app = (
		<StrictMode>
			<RouteContext.Provider value={"error" in route ? route : { last: route }}>
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
