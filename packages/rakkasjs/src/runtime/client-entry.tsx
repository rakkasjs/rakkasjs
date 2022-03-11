import React, { ReactElement, ReactNode } from "react";
import { hydrate } from "react-dom";
import { LayoutModule, PageModule } from "./page-types";

// declare const PAGE_STACK: string[];

declare const $RAKKAS_PAGE_MODULES: string[];

async function startClient() {
	const modules: [PageModule, ...LayoutModule[]] = (await Promise.all(
		$RAKKAS_PAGE_MODULES.map((m) => import(/* vite-ignore */ m)),
	)) as any;

	const content = modules.reduce(
		(prev, { default: Component }) => <Component children={prev} />,
		null as ReactNode,
	);

	hydrate(content as ReactElement, document.getElementById("root"));
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
