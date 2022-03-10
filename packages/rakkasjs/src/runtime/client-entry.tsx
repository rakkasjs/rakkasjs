import React, { ReactElement, ReactNode } from "react";
import { hydrate } from "react-dom";

// declare const PAGE_STACK: string[];

async function startClient() {
	const routes = await import("virtual:rakkasjs:client-page-routes");
	const path = location.pathname;
	for (const [regex, importers] of routes.default) {
		const match = regex.exec(path);
		if (!match) continue;

		// const params = match.groups || {};

		const modules = await Promise.all(importers.map((importer) => importer()));

		const content = modules.reduce(
			(prev, { default: Component }) => <Component children={prev} />,
			null as ReactNode,
		);

		hydrate(content as ReactElement, document.getElementById("root"));
		break;
	}
}

startClient();
