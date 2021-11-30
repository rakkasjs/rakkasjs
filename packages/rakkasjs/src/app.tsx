import React, { FC, useRef, useState, useCallback } from "react";
import { useBaseRouter } from "./lib/router/useBaseRouter";
import { findRoute, Route } from "./lib/find-route";
import { navigate, Router, RouteRenderArgs } from "./lib/router/Router";
import { RouterProvider } from "./lib/useRouter";
import { StackResult, makeComponentStack } from "./lib/makeComponentStack";
import { LoadHelpers } from "./lib/types";
import { updateSetRootContext } from "./root-context";

export const App: FC<{
	initialStack: StackResult;
	routes: Route[];
	helpers: LoadHelpers;
}> = ({ initialStack, routes, helpers }) => {
	const initialRender = useRef(true);
	const lastStack = useRef(initialStack);
	const [rootContextState, setRootContextState] = useState($rakkas$rootContext);
	updateSetRootContext(setRootContextState);

	const render = useCallback(
		async ({ url, rerender }: RouteRenderArgs) => {
			const found = findRoute(decodeURI(url.pathname), routes, true) || {
				stack: [],
				params: {},
				match: undefined,
			};

			let reloadPending = false;

			const stack = await makeComponentStack({
				found,
				url,
				fetch,
				reload(i) {
					lastStack.current.rendered[i].cacheKey = "";
					if (!reloadPending) {
						reloadPending = true;
						rerender();
						requestAnimationFrame(() => (reloadPending = false));
					}
				},
				previousRender: lastStack.current.rendered,
				rootContext: rootContextState,
				helpers,
			});

			if (stack.status === 404 && !initialRender.current) {
				return null;
			}

			const lastRendered = stack.rendered[stack.rendered.length - 1].loaded;
			if ("location" in lastRendered) {
				navigate(String(lastRendered.location), { replace: true });
			}

			initialRender.current = false;

			lastStack.current = stack;

			return <Wrapper params={stack.params}>{stack.content}</Wrapper>;
		},
		[rootContextState, routes, helpers],
	);

	return (
		<Router
			render={render}
			// skipInitialRender={isDataValid.current.every(Boolean)}
		>
			<Wrapper params={initialStack.params}>
				{lastStack.current.content}
			</Wrapper>
		</Router>
	);
};

const Wrapper: FC<{
	params: Record<string, string>;
}> = ({ params, children }) => {
	const router = useBaseRouter();

	return (
		<RouterProvider value={{ ...router, params }}>{children}</RouterProvider>
	);
};
