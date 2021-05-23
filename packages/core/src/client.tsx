import React, { ComponentType, FC, ReactNode, useRef, useState } from "react";
import { hydrate } from "react-dom";
import { Router } from ".";
import { findPage } from "./pages";

const notFoundModuleImporter = () => ({
	default: () => <p>Not found</p>,
});

export async function startClient() {
	const url = new URL(window.location.href);

	const { stack, params } = findPage(url.pathname, notFoundModuleImporter);

	const components = await (
		await Promise.all(stack.map((importer) => importer()))
	).map((m) => m.default);

	hydrate(
		<App
			initialStack={components}
			initialParams={params}
			initialData={__RAKKAS_INITIAL_DATA}
		/>,
		document.getElementById("rakkas-app"),
	);
}

const App: FC<{
	initialParams: any;
	initialData: any[];
	initialStack: ComponentType[];
}> = ({ initialParams, initialData, initialStack }) => {
	const lastStack = useRef(initialStack);
	const lastData = useRef(initialData);
	const isDataValid = useRef(initialData.map(() => true));

	const url = new URL(window.location.href);

	return (
		<Router
			render={async ({ url, rerender }) => {
				const { stack, params } = findPage(
					url.pathname,
					notFoundModuleImporter,
				);

				let different = false;

				const modules = await await Promise.all(
					stack.map((importer) => importer()),
				);

				for (const [i, mdl] of modules.entries()) {
					if (lastStack.current[i] !== mdl.default) {
						different = true;
						lastStack.current.length = i;
						lastStack.current[i] = mdl.default;
						lastData.current.length = i;
					}

					if (different || !isDataValid.current[i]) {
						lastData.current[i] =
							(await mdl.load?.({ url, params, fetch }))?.props ?? {};
						isDataValid.current[i] = true;
					}
				}

				return lastStack.current.reduceRight(
					(prev, cur, i) =>
						React.createElement(
							cur,
							{
								...lastData.current[i],
								params,
								url,
								reload() {
									if (isDataValid.current[i]) {
										isDataValid.current[i] = false;
										rerender();
									}
								},
							},
							prev,
						),
					null as React.ReactNode,
				);
			}}
			// skipInitialRender
		>
			{lastStack.current.reduceRight(
				(prev, cur, i) =>
					React.createElement(
						cur,
						{
							...__RAKKAS_INITIAL_DATA[i],
							params: initialParams,
							url,
							reload() {
								isDataValid.current[i] = false;
							},
						},
						prev,
					),
				null as React.ReactNode,
			)}
		</Router>
	);
};
