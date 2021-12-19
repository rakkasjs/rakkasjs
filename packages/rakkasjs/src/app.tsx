import React, { FC, useRef, useState, useCallback } from "react";
import { findRoute, Route } from "./lib/find-route";
import { navigate, Knave } from "knave-react";
import { StackResult, makeComponentStack } from "./lib/makeComponentStack";
import { CommonHooks, LoadHelpers } from "./lib/types";
import { updateSetRootContext } from "./root-context";
import { ParamsContext } from "./lib/useRouter";
import { Helmet } from "react-helmet-async";
import * as commonHooks from "virtual:rakkasjs:common-hooks";
import { detectLanguage } from "./lib/detectBrowserLanguage";
import { LocaleContext } from "./lib/useLocale";

let unmounted = false;

export const App: FC<{
	initialStack: StackResult;
	routes: Route[];
	helpers: LoadHelpers;
	locale: string;
}> = ({ initialStack, routes, helpers, locale }) => {
	const initialRender = useRef(true);
	const lastRender = useRef({ stack: initialStack, locale });
	const [rootContextState, setRootContextState] = useState($rakkas$rootContext);
	const rootContextRef = useRef(rootContextState);
	rootContextRef.current = rootContextState;

	updateSetRootContext(setRootContextState);

	const render = useCallback(
		async (signal: AbortSignal) => {
			if (unmounted) return lastRender.current.stack.content;

			const href = location.href;
			let url = new URL(href);
			const data = history.state.data;

			let locale = RAKKAS_DEFAULT_LOCALE;

			const extractLocale = (commonHooks.default as CommonHooks)?.extractLocale;
			if (extractLocale) {
				const result: any = extractLocale(url);

				if (RAKKAS_DETECT_LOCALE && result.redirect) {
					const redir =
						result.redirect[detectLanguage(Object.keys(result.redirect))];

					navigate(String(redir), {
						replace: true,
						scroll: false,
						data,
					});

					return;
				} else {
					locale = result.locale;
					url = result.url ? new URL(result.url, url) : url;
				}
			}

			const found = findRoute(decodeURI(url.pathname), routes, true) || {
				stack: [],
				params: {},
				match: undefined,
			};

			let reloadPending = false;

			const stack = (await makeComponentStack({
				found,
				url,
				fetch,
				reload(i) {
					lastRender.current.stack.rendered[i].cacheKey = "";
					if (!reloadPending) {
						reloadPending = true;
						navigate(href, {
							replace: true,
							scroll: false,
							data,
						}).then(() => (reloadPending = false));
					}
				},
				previousRender: {
					locale: lastRender.current.locale,
					stack: lastRender.current.stack.rendered,
				},
				rootContext: rootContextRef.current,
				locale,
				helpers,
			}))!;

			if (signal.aborted) {
				return null;
			}

			if ("location" in stack) {
				navigate(stack.location, { replace: true });
				return null;
			}

			if (!stack.found) {
				unmounted = true;

				// We will hard reload if no route found (maybe it's a link to a static file)

				let resolve: () => void;
				const done = () => resolve!();

				window.addEventListener("popstate", done);

				// This hack is needed for Chrome: We have to take back the soft nav and perform a hard nav instead
				history.go(-1);

				await new Promise<void>((r) => (resolve = r));

				window.removeEventListener("popstate", done);

				location.href = url.href;

				return new Promise(() => {
					// Wait forever!
				});
			}

			initialRender.current = false;
			lastRender.current = { stack, locale };

			return (
				<LocaleContext.Provider value={locale}>
					<ParamsContext.Provider value={{ params: stack.params }}>
						{stack.content}
						<Helmet htmlAttributes={{ lang: locale }} />
					</ParamsContext.Provider>
				</LocaleContext.Provider>
			);
		},
		[routes, helpers],
	);

	return (
		<Knave
			render={render}
			// skipInitialRender={isDataValid.current.every(Boolean)}
		>
			<LocaleContext.Provider value={locale}>
				<ParamsContext.Provider value={{ params: initialStack.params }}>
					{lastRender.current.stack.content}
					<Helmet htmlAttributes={{ lang: locale }} />
				</ParamsContext.Provider>
			</LocaleContext.Provider>
		</Knave>
	);
};
