import React, { StrictMode, Suspense } from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { DEFAULT_QUERY_OPTIONS } from "../features/use-query/implementation";
import { UseQueryOptions, ErrorBoundary, CommonPluginOptions } from "../lib";
import { App, loadRoute, RouteContext } from "./App";
import { ClientHooks } from "./client-hooks";
import { featureClientHooks } from "./feature-client-hooks";
import { IsomorphicContext } from "./isomorphic-context";
import ErrorComponent from "rakkasjs:error-page";
import { PageContext } from "./page-types";
import { sortHooks } from "./utils";
import { commonHooks } from "./feature-common-hooks";
import factories from "rakkasjs:plugin-client-hooks";
import * as commonHooksModule from "rakkasjs:common-hooks";

export type { ClientHooks };

/** Options passed to {@link startClient} */
export interface StartClientOptions {
	/** Default options for {@link useQuery} hooks */
	defaultQueryOptions?: UseQueryOptions;
	/** Client hooks */
	hooks?: ClientHooks;
}

export interface ClientPluginOptions {}

export type ClientPluginFactory = (
	options: ClientPluginOptions,
	commonOptions: CommonPluginOptions,
) => ClientHooks;

/** Starts the client. */
export async function startClient(
	options: StartClientOptions = {},
	pluginOptions: ClientPluginOptions = {},
) {
	Object.assign(DEFAULT_QUERY_OPTIONS, options.defaultQueryOptions);

	const { commonPluginOptions = {} } = commonHooksModule;

	const hooks = [
		...factories.map((factory) => factory(pluginOptions, commonPluginOptions)),
		...featureClientHooks,
	];

	const beforeStartHandlers = sortHooks([
		...hooks.map((hook) => hook.beforeStart),
		options.hooks?.beforeStart,
	]);

	for (const handler of beforeStartHandlers) {
		await handler();
	}

	const pageContext: PageContext = {
		url: new URL(window.location.href),
		locals: {},
	} as any;

	const extendPageContextHandlers = sortHooks([
		...hooks.map((hook) => hook.extendPageContext),
		options.hooks?.extendPageContext,
		...commonHooks.map((hook) => hook.extendPageContext),
	]);

	for (const handler of extendPageContextHandlers) {
		await handler(pageContext);
	}

	const wrapAppHandlers = sortHooks([
		...hooks.map((hook) => hook.wrapApp),
		options.hooks?.wrapApp,
		...commonHooks.map((hook) => hook.wrapApp),
	]).reverse();

	let app = <App />;

	for (const handler of wrapAppHandlers) {
		app = handler(app);
	}

	app = (
		<IsomorphicContext.Provider value={pageContext}>
			{app}
		</IsomorphicContext.Provider>
	);

	history.replaceState(
		{
			...history.state,
			actionData: rakkas.actionData,
		},
		"",
	);

	const route = await loadRoute(
		pageContext,
		new URL(window.location.href),
		undefined,
		true,
		rakkas.actionData,
	).catch((error) => {
		return { error };
	});

	app = (
		<RouteContext.Provider value={"error" in route! ? route : { last: route }}>
			<Suspense>
				<ErrorBoundary FallbackComponent={ErrorComponent}>{app}</ErrorBoundary>
			</Suspense>
		</RouteContext.Provider>
	);

	if (import.meta.env.DEV && process.env.RAKKAS_STRICT_MODE === "true") {
		app = <StrictMode>{app}</StrictMode>;
	}

	const container = document.getElementById("root")!;

	rakkas.clientRender
		? createRoot(container).render(app)
		: hydrateRoot(container, app);
}
