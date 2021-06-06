import React, { ComponentType, FC, useRef, ReactNode } from "react";
import { hydrate } from "react-dom";
import { Router } from ".";
import { makeComponentStack } from "./makeComponentStack";
import { ErrorHandlerProps } from "./types";

export async function startClient() {
	const url = new URL(window.location.href);
	const isDataValid = __RAKKAS_INITIAL_DATA.map(() => true);

	const stack = await makeComponentStack({
		url,
		fetch,
		previousRender: {
			data: __RAKKAS_INITIAL_DATA,
			isDataValid,
			components: [],
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
			initialContent={stack.content}
			initialDataValidity={isDataValid}
		/>,
		document.getElementById("rakkas-app"),
	);
}

const App: FC<{
	initialContent: ReactNode;
	initialData: unknown[];
	initialStack: ComponentType<ErrorHandlerProps>[];
	initialDataValidity: boolean[];
}> = ({ initialContent, initialData, initialStack, initialDataValidity }) => {
	const lastStack = useRef(initialStack);
	const lastData = useRef(initialData);
	const isDataValid = useRef(initialDataValidity);

	return (
		<Router
			render={async ({ url, rerender }) => {
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
						isDataValid: isDataValid.current,
					},
				});

				if ("location" in stack) {
					throw new Error("Client-side redirection not implemented yet");
				}

				return stack.content;
			}}
			// skipInitialRender
		>
			{initialContent}
		</Router>
	);
};
