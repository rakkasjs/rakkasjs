import React, {
	FC,
	useRef,
	useState,
	useCallback,
	Dispatch,
	SetStateAction,
} from "react";
import { useBaseRouter } from "./lib/router/useBaseRouter";
import { findRoute, Route } from "./lib/find-route";
import { navigate, Router, RouteRenderArgs } from "./lib/router/Router";
import { initClientGlobal, setGlobal } from "./lib/init-global";
import { RouterProvider } from "./lib/useRouter";
import { StackResult, makeComponentStack } from "./lib/makeComponentStack";
import { RootContext } from "./lib/types";

export let setRootContext = initClientGlobal<
	Dispatch<SetStateAction<RootContext>>
>("rootContext", () => {
	throw new Error("setRootContext called outside of the render tree");
});

export const App: FC<{
	initialStack: StackResult;
	routes: Route[];
}> = ({ initialStack, routes }) => {
	const initialRender = useRef(true);
	const lastStack = useRef(initialStack);
	const [rootContextState, setRootContextState] = useState($rakkas$rootContext);
	setRootContext = setGlobal("rootContext", setRootContextState);

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
			});

			if ("location" in stack) {
				navigate(String(stack.location), { replace: true });
				return <></>;
			}

			if (stack.status === 404 && !initialRender.current) {
				return null;
			}

			initialRender.current = false;

			lastStack.current = stack;

			return <Wrapper params={stack.params}>{stack.content}</Wrapper>;
		},
		[rootContextState, routes],
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
