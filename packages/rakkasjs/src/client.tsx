import "core-js/features/array/flat";
import "core-js/features/object/from-entries";
import "core-js/features/string/match-all";

import React, { FC, useRef, useState } from "react";
import { hydrate } from "react-dom";
import { HelmetProvider } from "react-helmet-async";
import {
	RakkasProvider,
	Router,
	useRouter,
	makeComponentStack,
	RenderedStackItem,
	StackResult,
} from ".";
import { Route } from "./lib/find-route";

const lastRendered: RenderedStackItem[] = __RAKKAS_RENDERED;

export async function startClient(routes: Route[]) {
	const url = new URL(window.location.href);

	const stack = await makeComponentStack({
		routes,
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

const App: FC<{
	initialStack: StackResult;
	routes: Route[];
}> = ({ initialStack, routes }) => {
	const lastStack = useRef(initialStack);
	const [rootContext, setRootContext] = useState(__RAKKAS_ROOT_CONTEXT);

	return (
		<Router
			render={async ({ url, rerender, navigate }) => {
				const stack = await makeComponentStack({
					routes,
					url,
					fetch,
					reload(i) {
						lastStack.current.rendered[i].cacheKey = "";
						rerender();
					},
					previousRender: lastStack.current.rendered,
					rootContext,
				});

				if ("location" in stack) {
					navigate(String(stack.location), { replace: true });
					return null;
				}

				lastStack.current = stack;

				return (
					<Wrapper
						params={stack.params}
						setRootContext={(arg) => {
							setRootContext(arg);
							rerender();
						}}
					>
						{stack.content}
					</Wrapper>
				);
			}}
			// skipInitialRender={isDataValid.current.every(Boolean)}
		>
			<Wrapper params={initialStack.params} setRootContext={setRootContext}>
				{lastStack.current.content}
			</Wrapper>
		</Router>
	);
};

const Wrapper: FC<{
	params: Record<string, string>;
	setRootContext(
		value:
			| Record<string, unknown>
			| ((old: Record<string, unknown>) => Record<string, unknown>),
	): void;
}> = ({ params, setRootContext, children }) => {
	const router = useRouter();

	return (
		<RakkasProvider value={{ ...router, params, setRootContext }}>
			{children}
		</RakkasProvider>
	);
};
