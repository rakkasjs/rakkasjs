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
import { App } from "./app";
import { findRoute, Route } from "./lib/find-route";
import { CommonHooks } from "./lib/types";
import { navigate } from "knave-react";
import * as clientHooksImport from "virtual:rakkasjs:client-hooks";
import * as commonHooksImport from "virtual:rakkasjs:common-hooks";
import { detectLanguage } from "./lib/detectBrowserLanguage";

const lastRendered: RenderedStackItem[] =
	(window as any).$rakkas$rendered || [];

export async function startClient(routes?: Route[]) {
	let clientHooks = clientHooksImport;

	if ((clientHooks as any).default) clientHooks = (clientHooks as any).default;

	const { beforeStartClient, wrap, createLoadHelpers } = clientHooks;

	if (beforeStartClient) {
		await beforeStartClient($rakkas$rootContext);
	}

	const helpers = createLoadHelpers
		? await createLoadHelpers($rakkas$rootContext)
		: {};

	let url = new URL(window.location.href);

	const commonHooks: CommonHooks | undefined = commonHooksImport.default;

	let locale = RAKKAS_DEFAULT_LOCALE;

	const extractLocale = commonHooks?.extractLocale;
	if (extractLocale) {
		const result: any = extractLocale(url);

		if (RAKKAS_DETECT_LOCALE && result.redirect) {
			const redir =
				result.redirect[detectLanguage(Object.keys(result.redirect))];

			const r2 = extractLocale(new URL(redir, location.href));

			if (!("redirect" in r2)) {
				locale = r2.locale;
				url = r2.url ? new URL(r2.url, location.href) : url;
			}

			if (url.origin === location.origin) {
				history.replaceState({}, "", url.href);
			} else {
				location.href = String(url);
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
		previousRender: {
			stack: lastRendered,
			locale: document.documentElement.lang,
		},
		reload(i) {
			(stack as any).rendered[i].cacheKey = "";
			navigate(url.href, {
				replace: true,
				scroll: false,
				data: history.state.data,
			});
		},
		rootContext: $rakkas$rootContext,
		isInitialRender: true,
		locale,
		helpers,
	}))!;

	if ("location" in stack) {
		// Shouldn't happen, but just in case
		location.href = stack.location;
		return;
	}

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
