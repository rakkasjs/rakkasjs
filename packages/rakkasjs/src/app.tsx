import React, { FC, useRef, useState, useCallback } from "react";
import { findRoute, Route } from "./lib/find-route";
import { navigate, Knave } from "knave-react";
import { StackResult, makeComponentStack } from "./lib/makeComponentStack";
import { CommonHooks, LoadHelpers } from "./lib/types";
import { updateSetRootContext } from "./root-context";
import { ParamsContext } from "./lib/useRouter";
import { Helmet } from "react-helmet-async";
import commonHooks from "virtual:rakkasjs:common-hooks";
import { availableLocales, selectLocale } from "./lib/selectLocale";

let unmounted = false;

export const App: FC<{
	initialStack: StackResult;
	routes: Route[];
	helpers: LoadHelpers;
	locale?: string;
}> = ({ initialStack, routes, helpers, locale }) => {
	const initialRender = useRef(true);
	const lastStack = useRef(initialStack);
	const [rootContextState, setRootContextState] = useState<any>({
		...$rakkas$rootContext,
		locale,
	});
	const rootContextRef = useRef(rootContextState);
	rootContextRef.current = rootContextState;

	updateSetRootContext(setRootContextState);

	const render = useCallback(
		async (signal: AbortSignal) => {
			if (unmounted) return lastStack.current.content;

			const href = location.href;
			let url = new URL(href);
			const data = history.state.data;

			let locale: string | undefined;

			if (availableLocales) {
				const selectLocale = (commonHooks as CommonHooks)?.selectLocale;

				if (selectLocale) {
					const result = selectLocale(url, detectLanguage);

					if ("redirect" in result) {
						navigate(String(result.redirect), {
							replace: true,
							scroll: false,
							data,
						});

						return;
					} else {
						url = result.url ? new URL(result.url, url) : url;
					}
				}

				if (locale && locale !== rootContextRef.current.locale) {
					// Schedule a rerender and skip this one
					setRootContextState((old: any) => ({ ...old, locale }));

					navigate(href, {
						replace: true,
						scroll: false,
						data,
					});

					return;
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
					lastStack.current.rendered[i].cacheKey = "";
					if (!reloadPending) {
						reloadPending = true;
						navigate(href, {
							replace: true,
							scroll: false,
							data,
						}).then(() => (reloadPending = false));
					}
				},
				previousRender: lastStack.current.rendered,
				rootContext: rootContextRef.current,
				helpers,
			}))!;

			if (signal.aborted) {
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

			const lastRendered = stack.rendered[stack.rendered.length - 1].loaded;
			initialRender.current = false;

			if ("location" in lastRendered) {
				navigate(String(lastRendered.location), { replace: true });
				return null;
			}

			lastStack.current = stack;

			return (
				<ParamsContext.Provider value={{ params: stack.params }}>
					{locale && <Helmet htmlAttributes={{ lang: locale }} />}
					{stack.content}
				</ParamsContext.Provider>
			);
		},
		[routes, helpers],
	);

	return (
		<Knave
			render={render}
			// skipInitialRender={isDataValid.current.every(Boolean)}
		>
			<ParamsContext.Provider value={{ params: initialStack.params }}>
				{rootContextRef.current.locale && (
					<Helmet htmlAttributes={{ lang: rootContextRef.current.locale }} />
				)}
				{lastStack.current.content}
			</ParamsContext.Provider>
		</Knave>
	);
};

export function detectLanguage(): string {
	if (!RAKKAS_DETECT_LOCALE) return "en";

	let fromCookie: string | undefined;

	if (RAKKAS_LOCALE_COOKIE_NAME) {
		const cookie = document.cookie;

		if (cookie) {
			const match = cookie.match(
				new RegExp(`(?:^|;)\\s*${RAKKAS_LOCALE_COOKIE_NAME}=([^;]+)`),
			);

			if (match !== null) {
				fromCookie = match[1];
			}
		}
	}

	const languages = navigator.languages || [navigator.language || "en"];

	return selectLocale(fromCookie ? [fromCookie, ...languages] : languages);
}
