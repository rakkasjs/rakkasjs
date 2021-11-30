import "core-js/features/array/flat";
import "core-js/features/object/from-entries";
import "core-js/features/string/match-all";

import React from "react";
import { hydrate } from "react-dom";
import { HelmetProvider } from "react-helmet-async";
import {
	makeComponentStack,
	RenderedStackItem,
} from "./lib/makeComponentStack";
import { App } from "./app";
import { findRoute, Route } from "./lib/find-route";
import { ClientHooks } from "./lib/types";

const lastRendered: RenderedStackItem[] = $rakkas$rendered;

export async function startClient(routes?: Route[]) {
	let clientHooks: ClientHooks = await import("@rakkasjs/client-hooks");

	if ((clientHooks as any).default) clientHooks = (clientHooks as any).default;

	const { beforeStartClient, wrap, createLoadHelpers } = clientHooks;

	if (beforeStartClient) {
		await beforeStartClient($rakkas$rootContext);
	}

	const helpers = createLoadHelpers
		? await createLoadHelpers($rakkas$rootContext)
		: {};

	const url = new URL(window.location.href);

	routes = routes! || window.$rakkas$routes!;

	const found = findRoute(decodeURI(url.pathname), routes, true) || {
		stack: [],
		params: {},
		match: undefined,
	};

	const stack = await makeComponentStack({
		found,
		url,
		fetch,
		previousRender: lastRendered,
		reload(i) {
			lastRendered[i].cacheKey = "";
		},
		rootContext: $rakkas$rootContext,
		isInitialRender: true,
		helpers,
	});

	let rendered = (
		<HelmetProvider>
			<App initialStack={stack} routes={routes} helpers={helpers} />
		</HelmetProvider>
	);

	if (wrap) rendered = wrap(rendered, $rakkas$rootContext);

	hydrate(rendered, document.getElementById("rakkas-app"));
}
