import React, { FC, useRef, useState, useCallback } from "react";
import { findRoute, Route } from "./lib/find-route";
import { navigate, Knave } from "knave-react";
import { StackResult, makeComponentStack } from "./lib/makeComponentStack";
import { LoadHelpers } from "./lib/types";
import { updateSetRootContext } from "./root-context";
import { ParamsContext } from "./lib/useRouter";

export const App: FC<{
	initialStack: StackResult;
	routes: Route[];
	helpers: LoadHelpers;
}> = ({ initialStack, routes, helpers }) => {
	const initialRender = useRef(true);
	const lastStack = useRef(initialStack);
	const [rootContextState, setRootContextState] = useState($rakkas$rootContext);
	updateSetRootContext(setRootContextState);

	const render = useCallback(async () => {
		const url = new URL(location.href);
		const data = history.state.data;

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
					navigate(url.href, {
						replace: true,
						scroll: false,
						data,
					}).then(() => (reloadPending = false));
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
		initialRender.current = false;

		if ("location" in lastRendered) {
			navigate(String(lastRendered.location), { replace: true });
			return null;
		}

		lastStack.current = stack;

		return (
			<ParamsContext.Provider value={{ params: stack.params }}>
				{stack.content}
			</ParamsContext.Provider>
		);
	}, [rootContextState, routes, helpers]);

	return (
		<Knave
			render={render}
			// skipInitialRender={isDataValid.current.every(Boolean)}
		>
			<ParamsContext.Provider value={{ params: initialStack.params }}>
				{lastStack.current.content}
			</ParamsContext.Provider>
		</Knave>
	);
};
