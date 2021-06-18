import React, { ComponentType, FC, useRef, ReactNode } from "react";
import { hydrate } from "react-dom";
import { Router, ErrorHandlerProps } from ".";
import { makeComponentStack } from "./makeComponentStack";

export async function startClient() {
	const url = new URL(window.location.href);
	const isDataValid = __RAKKAS_INITIAL_DATA.map(() => true);

	const stack = await makeComponentStack({
		url,
		fetch,
		previousRender: {
			data: __RAKKAS_INITIAL_DATA,
			contexts: __RAKKAS_INITIAL_CONTEXT,
			isDataValid,
		},
		reload(i) {
			isDataValid[i] = false;
		},
	});

	// Redirection should not normally happen on initial render, but let's be safe
	if ("location" in stack) {
		window.location.href = String(stack.location);
		return;
	}

	hydrate(
		<App
			initialStack={stack.components}
			initialData={stack.data}
			initialContext={stack.contexts}
			initialContent={stack.content}
			initialDataValidity={isDataValid}
		/>,
		document.getElementById("rakkas-app"),
	);
}

const App: FC<{
	initialContent: ReactNode;
	initialData: unknown[];
	initialContext: Record<string, unknown>[];
	initialStack: ComponentType<ErrorHandlerProps>[];
	initialDataValidity: boolean[];
}> = ({
	initialContent,
	initialData,
	initialContext,
	initialStack,
	initialDataValidity,
}) => {
	const lastStack = useRef(initialStack);
	const lastData = useRef(initialData);
	const lastContext = useRef(initialContext);
	const isDataValid = useRef(initialDataValidity);

	console.log("Rendering outer");

	return (
		<Router
			render={async ({ url, rerender, navigate }) => {
				console.log("Rendering inner");

				const stack = await makeComponentStack({
					fetch,
					reload(i) {
						isDataValid.current[i] = false;
						rerender();
					},
					url,
					previousRender: {
						components: lastStack.current,
						data: lastData.current,
						contexts: lastContext.current,
						isDataValid: isDataValid.current,
					},
				});

				if ("location" in stack) {
					navigate(String(stack.location), { replace: true });
					return null;
				}

				return stack.content;
			}}
			// skipInitialRender={isDataValid.current.every(Boolean)}
		>
			{initialContent}
		</Router>
	);
};
