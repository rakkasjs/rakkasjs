/// <reference types="react/next" />
/// <reference types="react-dom/next" />

import React, { ReactElement, ReactNode } from "react";
import { hydrateRoot } from "react-dom/client";
import { LayoutModule } from "./page-types";
import { SsrCacheContext } from "./ssr-cache";

import { ClientHooksModule } from "./client-hooks";
import * as reactHelmetAsyncHooks from "./builtin-client-hooks/react-helmet-async";

const hookModules: ClientHooksModule[] = [reactHelmetAsyncHooks];

declare const $RAKKAS_PAGE_MODULES: string[];
declare const $RAKKAS_PATH_PARAMS: Record<string, string>;
declare const $RAKKAS_SSR_CACHE: Record<string, any>;

export async function go() {
	throw new Error("Not implemented");
}

async function startClient() {
	const modules: LayoutModule[] = (await Promise.all(
		$RAKKAS_PAGE_MODULES.map((m) => import(/* @vite-ignore */ m)),
	)) as any;

	const url = new URL(window.location.href);

	let app: ReactNode = modules.reduce(
		(prev, { default: Component = ({ children }) => <>{children}</> }) => (
			<Component children={prev} url={url} params={$RAKKAS_PATH_PARAMS} />
		),
		null as any as ReactElement,
	);

	for (const hooks of hookModules) {
		if (hooks.wrapApp) {
			app = hooks.wrapApp(app);
		}
	}

	hydrateRoot(
		document.getElementById("root")!,
		<SsrCacheContext.Provider
			value={{
				get: (key) => $RAKKAS_SSR_CACHE[key],
				set: (key, value) => ($RAKKAS_SSR_CACHE[key] = value),
			}}
		>
			{app}
		</SsrCacheContext.Provider>,
	);
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
