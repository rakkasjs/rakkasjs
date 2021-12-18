import "core-js/features/array/flat";
import "core-js/features/object/from-entries";
import "core-js/features/string/match-all";

import React from "react";
import { hydrate, render } from "react-dom";
import { HelmetProvider } from "react-helmet-async";
import {
	makeComponentStack,
	RenderedStackItem,
} from "./lib/makeComponentStack";
import { App, detectLanguage } from "./app";
import { findRoute, Route } from "./lib/find-route";
import { ClientHooks, CommonHooks } from "./lib/types";
import { navigate } from "knave-react";

const lastRendered: RenderedStackItem[] =
	(window as any).$rakkas$rendered || [];

export async function startClient(routes?: Route[]) {
	let clientHooks: ClientHooks = await import("virtual:rakkasjs:client-hooks");

	if ((clientHooks as any).default) clientHooks = (clientHooks as any).default;

	const { beforeStartClient, wrap, createLoadHelpers } = clientHooks;

	if (beforeStartClient) {
		await beforeStartClient($rakkas$rootContext);
	}

	const helpers = createLoadHelpers
		? await createLoadHelpers($rakkas$rootContext)
		: {};

	let url = new URL(window.location.href);

	const commonHooks: CommonHooks | undefined = (
		await import("virtual:rakkasjs:common-hooks")
	).default;

	let locale: string | undefined;
	const selectLocale = commonHooks?.selectLocale;
	if (selectLocale) {
		const result = selectLocale(url, detectLanguage);

		if ("redirect" in result) {
			let r = result.redirect;
			if (typeof r === "string") {
				r = new URL(r, url);
			}

			if (r.origin === location.origin) {
				history.replaceState({}, "", r.href);
			} else {
				location.href = String(result.redirect);
				return;
			}
		} else {
			url = result.url ? new URL(result.url, url) : url;
			locale = result.locale;
		}
	}

	routes = routes! || window.$rakkas$routes!;

	const found = findRoute(decodeURI(url.pathname), routes, true) || {
		stack: [],
		params: {},
		match: undefined,
	};

	const stack = (await makeComponentStack({
		found,
		url,
		fetch,
		previousRender: lastRendered,
		reload(i) {
			stack.rendered[i].cacheKey = "";
			navigate(url.href, {
				replace: true,
				scroll: false,
				data: history.state.data,
			});
		},
		rootContext: $rakkas$rootContext,
		isInitialRender: true,
		helpers,
	}))!;

	let rendered = (
		<HelmetProvider>
			<App
				initialStack={stack}
				routes={routes}
				helpers={helpers}
				locale={locale}
			/>
		</HelmetProvider>
	);

	if (wrap) rendered = wrap(rendered, $rakkas$rootContext);

	const container = document.getElementById("rakkas-app");

	if (lastRendered.length) {
		hydrate(rendered, container);
	} else {
		render(rendered, container);
	}
}
