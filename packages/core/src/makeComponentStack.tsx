import React, { ComponentType } from "react";
import { findPage } from "./pages";
import { ErrorDescription, ErrorHandlerProps, LayoutLoadResult } from "./types";

interface StackArgs {
	url: URL;
	fetch: typeof fetch;
	previousRender: {
		data: unknown[];
		isDataValid: boolean[];
		components: ComponentType<ErrorHandlerProps>[];
	};
	reload(i: number): void;
}

export async function makeComponentStack({
	url,
	fetch,
	previousRender: { data: prevData, isDataValid, components: prevComponents },
	reload,
}: StackArgs) {
	const { stack, params, match } = findPage(url.pathname);

	const contexts: Array<Record<string, unknown>> = [{}];
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

		if (i === stack.length - 1 && match) {
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
			(!isDataValid[i] || module.default !== prevComponents[i])
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
				if (loadResult.context) context = loadResult.context;
				contexts.push(context);
			} else if ("error" in loadResult) {
				data.push({});
				error = loadResult.error;
				contexts.push(context);
				break;
			} else {
				return loadResult;
			}
		} else {
			data.push(prevData[i] ?? {});
		}
	}

	if (error) {
		console.log("Truncationg to", errorHandlerIndex);
		components.length = errorHandlerIndex + 1;
	}

	const content = components.reduceRight(
		(prev, Component, i) => (
			<Component
				context={contexts[i]}
				data={data[i]}
				params={params}
				match={match}
				url={url}
				error={errorHandlerIndex === i ? error : undefined}
				reload={() => reload(i)}
			>
				{prev}
			</Component>
		),
		null as React.ReactNode,
	);

	return { content, data, components, status: error?.status ?? 200 };
}
