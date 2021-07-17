import "core-js/features/array/flat";
import "core-js/features/object/from-entries";
import "core-js/features/string/match-all";

import React from "react";
import { hydrate } from "react-dom";
import { HelmetProvider } from "react-helmet-async";
import { makeComponentStack, RenderedStackItem } from ".";
import { App } from "./app";
import { findRoute, Route } from "./lib/find-route";

const lastRendered: RenderedStackItem[] = __RAKKAS_RENDERED;

export async function startClient(routes?: Route[]) {
	const clientHooks = await import("@rakkasjs/client-hooks");

	const { beforeStartClient } = clientHooks;

	if (beforeStartClient) {
		await beforeStartClient();
	}

	const url = new URL(window.location.href);

	routes = routes! || __RAKKAS_ROUTES!;

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
		rootContext: __RAKKAS_ROOT_CONTEXT,
		isInitialRender: true,
	});

	// Redirection should not happen on initial render, but let's keep ts compiler happy
	if ("location" in stack) {
		window.location.href = String(stack.location);
		return;
	}

	hydrate(
		<HelmetProvider>
			<App initialStack={stack} routes={routes} />
		</HelmetProvider>,
		document.getElementById("rakkas-app"),
	);
}
