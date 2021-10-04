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

const lastRendered: RenderedStackItem[] = $rakkas$rendered;

export async function startClient(routes?: Route[]) {
	const clientHooks = await import("@rakkasjs/client-hooks");

	const { beforeStartClient, wrap, createLoadHelpers } = clientHooks;

	if (beforeStartClient) {
		await beforeStartClient();
	}

	const helpers = createLoadHelpers ? await createLoadHelpers() : {};

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

	// Redirection should not happen on initial render, but let's keep ts compiler happy
	if ("location" in stack) {
		window.location.href = String(stack.location);
		return;
	}

	let rendered = (
		<HelmetProvider>
			<App initialStack={stack} routes={routes} helpers={helpers} />
		</HelmetProvider>
	);

	if (wrap) rendered = wrap(rendered);

	hydrate(rendered, document.getElementById("rakkas-app"));
}
