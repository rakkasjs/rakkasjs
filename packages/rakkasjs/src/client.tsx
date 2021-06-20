import React, { FC, useRef } from "react";
import { hydrate } from "react-dom";
import { HelmetProvider } from "react-helmet-async";
import { Router } from "./router/Router";
import {
	makeComponentStack,
	RenderedStackItem,
	StackResult,
} from "./makeComponentStack";

const lastRendered: RenderedStackItem[] = __RAKKAS_RENDERED;

export async function startClient() {
	const url = new URL(window.location.href);

	const stack = await makeComponentStack({
		url,
		fetch,
		previousRender: lastRendered,
		reload(i) {
			lastRendered[i].cacheKey = "";
		},
		rootContext: __RAKKAS_ROOT_CONTEXT,
	});

	// Redirection should not happen on initial render, but let's keep ts compiler happy
	if ("location" in stack) {
		window.location.href = String(stack.location);
		return;
	}

	hydrate(
		<HelmetProvider>
			<App initialStack={stack} />
		</HelmetProvider>,
		document.getElementById("rakkas-app"),
	);
}

const App: FC<{
	initialStack: StackResult;
}> = ({ initialStack }) => {
	const lastStack = useRef(initialStack);

	return (
		<Router
			render={async ({ url, rerender, navigate }) => {
				const stack = await makeComponentStack({
					url,
					fetch,
					reload(i) {
						lastStack.current.rendered[i].cacheKey = "";
						rerender();
					},
					previousRender: lastStack.current.rendered,
					rootContext: __RAKKAS_ROOT_CONTEXT,
				});

				if ("location" in stack) {
					navigate(String(stack.location), { replace: true });
					return null;
				}

				lastStack.current = stack;

				return stack.content;
			}}
			// skipInitialRender={isDataValid.current.every(Boolean)}
		>
			{lastStack.current.content}
		</Router>
	);
};
