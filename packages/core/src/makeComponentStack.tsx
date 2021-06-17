/* eslint-disable react-hooks/exhaustive-deps */
import React, { ComponentType, FC, useEffect, useRef } from "react";
import { findPage } from "./pages";
import {
	ErrorDescription,
	ErrorHandlerProps,
	LayoutLoadResult,
	LoadRedirectResult,
	ReloadHookParams,
} from ".";

interface StackArgs {
	url: URL;
	fetch: typeof fetch;
	previousRender: {
		data: unknown[];
		contexts: Record<string, unknown>[];
		isDataValid: boolean[];
		components?: ComponentType<ErrorHandlerProps>[];
	};
	reload(i: number): void;
}

export interface StackResult {
	content: React.ReactNode;
	data: unknown[];
	contexts: Record<string, unknown>[];
	components: React.ComponentType<
		ErrorHandlerProps<Record<string, string>, unknown, Record<string, unknown>>
	>[];
	status: number;
}

export async function makeComponentStack({
	url,
	fetch,
	previousRender: {
		data: prevData,
		contexts: prevContexts,
		isDataValid,
		components: prevComponents,
	},
	reload,
}: StackArgs): Promise<LoadRedirectResult | StackResult> {
	const { stack, params, match } = findPage(url.pathname);

	const usedContexts: Array<Record<string, unknown>> = [];
	const returnedContexts: Array<Record<string, unknown>> = [];
	let error: ErrorDescription | undefined;
	const components: ComponentType<ErrorHandlerProps>[] = [];
	let context: Record<string, unknown> = {};
	let errorHandlerIndex = -1;
	const data: unknown[] = [];

	if (!match) {
		error = {
			message: "Page not found",
			status: 404,
		};
	}

	for (const [i, importer] of stack.entries()) {
		const module = await importer();

		if (i === stack.length - 1) {
			// Page
			if (module.options?.canHandleErrors ?? false) {
				errorHandlerIndex = i;
			}
		} else {
			// Layout
			if (module.options?.canHandleErrors ?? true) {
				errorHandlerIndex = i;
			}
		}

		components.push(module.default);

		if (
			module.load &&
			(!isDataValid[i] ||
				(prevComponents && module.default !== prevComponents[i]))
		) {
			const loadResult = (await module.load({
				url,
				params,
				context,
				match,
				fetch,
			})) as LayoutLoadResult;

			if ("data" in loadResult) {
				data.push(loadResult.data);
				prevData[i] = loadResult.data;
				isDataValid[i] = true;
				const returnedContext = loadResult.context || {};
				prevContexts[i] = returnedContext;
				returnedContexts.push(returnedContext);
				context = { ...context, ...returnedContext };
				usedContexts.push(context);
			} else if ("error" in loadResult) {
				data.push({});
				prevData[i] = {};
				isDataValid[i] = true;
				error = loadResult.error;
				prevContexts[i] = {};
				returnedContexts.push({});
				usedContexts.push(context);
				break;
			} else {
				return loadResult;
			}
		} else {
			let returnedContext: Record<string, unknown>;

			if (prevComponents && module.default !== prevComponents[i]) {
				// Component changed
				data.push({});
				returnedContext = {};
			} else {
				// Component unchanged
				data.push(prevData[i] ?? {});
				returnedContext = prevContexts[i] ?? {};
			}
			isDataValid[i] = true;

			context = { ...context, ...returnedContext };
			prevContexts[i] = returnedContext;
			returnedContexts.push(returnedContext);
			usedContexts.push(context);
		}
	}

	if (error) {
		components.length = errorHandlerIndex + 1;
		if (components.length === 0) {
			components[0] = LastResort;
		}
	}

	const content = components.reduceRight((prev, Component, i) => {
		const reloadThis = () => reload(i);

		return (
			<Component
				context={usedContexts[i]}
				data={data[i]}
				params={params}
				match={match}
				url={url}
				error={errorHandlerIndex === i ? error : undefined}
				reload={reloadThis}
				useReload={makeUseReload(reloadThis, !prevComponents)}
			>
				{prev}
			</Component>
		);
	}, null as React.ReactNode);

	return {
		content,
		data,
		contexts: returnedContexts,
		components,
		status: error?.status ?? 200,
	};
}

function makeUseReload(reload: () => void, hydration: boolean) {
	return function useReload(params: ReloadHookParams) {
		const {
			deps = [],
			hydrate = false,
			focus = true,
			interval = false,
			background = false,
			reconnect = true,
		} = params;

		const firstRender = useRef(true);

		// Reload after hydrate or when deps change
		useEffect(() => {
			if (hydrate || !firstRender.current) {
				reload();
			}

			firstRender.current = false;
		}, [...deps]);

		// Reload on window focus
		useEffect(() => {
			if (!focus) return;

			function handleFocus() {
				reload();
			}

			window.addEventListener("focus", handleFocus);

			return () => {
				window.removeEventListener("focus", handleFocus);
			};
		}, [focus, hydration]);

		// Reload on reconnect
		useEffect(() => {
			if (!reconnect) return;

			function handleReconnect() {
				reload();
			}

			window.addEventListener("online", handleReconnect);

			return () => {
				window.removeEventListener("online", handleReconnect);
			};
		}, [reconnect, hydration]);

		// Reload on interval
		useEffect(() => {
			if (!interval) return;

			const id = setInterval(() => {
				if (background || document.visibilityState === "visible") {
					reload();
				}
			}, interval);

			return () => {
				clearInterval(id);
			};
		}, [interval, background, hydration]);
	};
}

const LastResort: FC<ErrorHandlerProps> = () =>
	import.meta.env.DEV ? (
		<p>
			There is no root page or layout in your page directory. Create one to get
			started.
		</p>
	) : (
		<p>Not found.</p>
	);
