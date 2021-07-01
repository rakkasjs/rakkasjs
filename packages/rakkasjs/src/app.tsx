import React, { FC, useRef, useState } from "react";
import { RakkasProvider, Router, makeComponentStack, StackResult } from ".";
import { useRouter } from "./lib/router/useRouter";
import { Route } from "./lib/find-route";

export const App: FC<{
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
