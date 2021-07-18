import React, { FC, useRef, useState, useCallback } from "react";
import { RakkasProvider, Router, makeComponentStack, StackResult } from ".";
import { useRouter } from "./lib/router/useRouter";
import { findRoute, Route } from "./lib/find-route";
import { navigate, RouteRenderArgs } from "./lib/router/Router";

export const App: FC<{
	initialStack: StackResult;
	routes: Route[];
}> = ({ initialStack, routes }) => {
	const initialRender = useRef(true);
	const lastStack = useRef(initialStack);
	const [rootContext, setRootContext] = useState(__RAKKAS_ROOT_CONTEXT);

	const render = useCallback(
		async ({ url, rerender }: RouteRenderArgs) => {
			const found = findRoute(decodeURI(url.pathname), routes, true) || {
				stack: [],
				params: {},
				match: undefined,
			};

			const stack = await makeComponentStack({
				found,
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

			if (stack.status === 404 && !initialRender.current) {
				return null;
			}

			initialRender.current = false;

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
		},
		[rootContext, routes],
	);

	return (
		<Router
			render={render}
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
