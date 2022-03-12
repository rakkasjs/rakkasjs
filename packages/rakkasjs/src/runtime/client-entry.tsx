/// <reference types="react/next" />
/// <reference types="react-dom/next" />

import React, { ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { LayoutModule, PageModule } from "./page-types";
import { SsrCacheContext } from "./ssr-cache";

declare const $RAKKAS_PAGE_MODULES: string[];
declare const $RAKKAS_SSR_CACHE: Record<string, any>;

async function startClient() {
	const modules: [PageModule, ...LayoutModule[]] = (await Promise.all(
		$RAKKAS_PAGE_MODULES.map((m) => import(/* @vite-ignore */ m)),
	)) as any;

	const content: ReactElement = modules.reduce(
		(prev, { default: Component }) => <Component children={prev} />,
		null as any as ReactElement,
	);

	hydrateRoot(
		document.getElementById("root")!,
		<SsrCacheContext.Provider
			value={{
				get: (key) => $RAKKAS_SSR_CACHE[key],
				set: (key, value) => ($RAKKAS_SSR_CACHE[key] = value),
			}}
		>
			<HelmetProvider>{content}</HelmetProvider>
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
