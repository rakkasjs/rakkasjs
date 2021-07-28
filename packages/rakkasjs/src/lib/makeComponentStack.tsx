/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import {
	ErrorDescription,
	LayoutLoadResult,
	LoadRedirectResult,
	ReloadHookParams,
} from "..";
import { wrapInErrorBoundary } from "./ErrorBoundary";
import {
	ErrorPage,
	GetCacheKeyFunc,
	LayoutComponentModule,
	Page,
	PageComponentModule,
	PageLoadResult,
	Layout,
	SimpleLayout,
} from "./types";
import { stableJson } from "./stable-json";
import { toErrorDescription } from "./toErrorDescription";

import importers from "@rakkasjs/page-imports";

const moduleCache: Record<string, any> = {};
const errorBoundaryCache: Record<string, any> = {};

export interface RenderedStackItem {
	Component?: Page | ErrorPage | Layout | SimpleLayout;
	loaded: PageLoadResult | LayoutLoadResult;
	cacheKey: string;
	name?: string;
}

interface StackArgs {
	found: {
		params: Record<string, string>;
		match?: string | undefined;
		stack: string[];
	};
	url: URL;
	fetch: typeof fetch;
	previousRender?: RenderedStackItem[];
	reload(i: number): void;
	rootContext: Record<string, unknown>;
	isInitialRender?: boolean;
}

export interface StackResult {
	params: Record<string, string>;
	status: number;
	content: React.ReactNode;
	rendered: RenderedStackItem[];
}

export async function makeComponentStack({
	found,
	url,
	fetch,
	previousRender,
	reload,
	isInitialRender,
	rootContext = {},
}: StackArgs): Promise<LoadRedirectResult | StackResult> {
	const { stack, params, match } = found;

	let error: ErrorDescription | undefined;
	const thisRender: RenderedStackItem[] = [];
	let context: Record<string, unknown> = { ...rootContext };
	let status = 200;
	let errorHandlerIndex = -1;

	if (!match) {
		status = 404;
		error = {
			message: "Page not found",
			status,
		};
	}

	for (const [i, moduleId] of stack.entries()) {
		let module = moduleCache[moduleId];
		if (!module) {
			if (import.meta.env.DEV) {
				moduleCache[moduleId] = module = await import(
					/* @vite-ignore */ moduleId
				);
			} else {
				moduleCache[moduleId] = module = await importers[moduleId]();
			}
		}

		const isPage = match && i === stack.length - 1;

		const moduleExports =
			typeof module.default === "object"
				? {
						Component: module.default.Component || DefaultLayout,
						load: module.default.load,
						options: module.default.options,
						getCacheKey:
							module.default.getCacheKey ||
							(isPage ? defaultPageGetCacheKey : () => ""),
				  }
				: {
						Component:
							(module as PageComponentModule | LayoutComponentModule).default ||
							DefaultLayout,
						load: (module as PageComponentModule | LayoutComponentModule).load,
						options: isPage
							? (module as PageComponentModule).pageOptions
							: (module as LayoutComponentModule).layoutOptions,
						getCacheKey:
							(module as PageComponentModule | LayoutComponentModule)
								.getCacheKey || (isPage ? defaultPageGetCacheKey : () => ""),
				  };

		const { load, options, getCacheKey } = moduleExports;
		let Component = moduleExports.Component;

		const canHandleErrors =
			options?.canHandleErrors ?? (!isPage && !!Component);

		if (canHandleErrors) {
			errorHandlerIndex = i;
			// A trick to preserve component identity between renders
			Component =
				errorBoundaryCache[moduleId] ||
				(errorBoundaryCache[moduleId] = wrapInErrorBoundary(Component as any));
		}

		const cacheKey = stableJson(getCacheKey({ url, params, match, context }));
		let loaded: PageLoadResult | LayoutLoadResult;

		if (
			// No previous render, we're in server side; should reload
			!previousRender ||
			// Different component; should reload
			!previousRender[i] ||
			(previousRender[i].name && previousRender[i].name !== moduleId) ||
			// Cache key manually invalidated; should reload
			!previousRender[i].cacheKey ||
			// Cache key changed; should reload
			previousRender[i].cacheKey !== cacheKey
		) {
			if (load) {
				try {
					loaded = await load({ url, params, match, context, fetch });
				} catch (error) {
					loaded = { status: 500, error: toErrorDescription(error) };
				}
			} else {
				loaded = {
					// Smallest serialized size
					data: 0,
				};
			}
		} else {
			loaded = previousRender[i].loaded;
		}

		if ("location" in loaded) {
			return loaded;
		}

		thisRender.push({
			Component,
			loaded,
			cacheKey,
			name: moduleId,
		});

		status = loaded.status ?? status;

		if ("error" in loaded) {
			if (status < 400) status = 500;
			error = loaded.error;
			break;
		}

		if ("context" in loaded) {
			context = {
				...context,
				...loaded.context,
			};
		}
	}

	if (error) {
		thisRender.length = errorHandlerIndex + 1;
	}

	if (!thisRender.length) {
		thisRender.push({
			Component: LastResort,
			cacheKey: "",
			loaded: { data: 0 },
		});
	}

	context = { ...rootContext };

	const content = thisRender.reduceRight((prev, rendered, i) => {
		const reloadThis = () => reload(i);

		const Component = rendered.Component!;
		context = { ...context, ...(rendered.loaded as any).context };

		if (import.meta.hot) {
			$rakkas$reloader[rendered.name || ""] = (newModule) => {
				moduleCache[rendered.name || ""] = newModule;
				delete errorBoundaryCache[rendered.name || ""];
				reloadThis();
			};
		}

		const props = {
			url: url,
			match: match,
			params: params,
			context: context,
			data: (rendered.loaded as any).data,
			error: errorHandlerIndex === i ? error : undefined,
			reload: reloadThis,
			useReload: makeUseReload(reloadThis, isInitialRender),
		};

		return <Component {...props}>{prev}</Component>;
	}, null as React.ReactNode);

	return {
		status,
		content,
		rendered: thisRender.map(({ ...rest }) => rest),
		params,
	};
}

function makeUseReload(reload: () => void, isInitialRender?: boolean) {
	return function useReload(params: ReloadHookParams) {
		const {
			focus = false,
			interval = false,
			background = false,
			reconnect = false,
		} = params;

		// Reload on window focus
		useEffect(() => {
			if (!focus) return;

			function handleVisibilityChange() {
				if (document.visibilityState === "visible") reload();
			}

			document.addEventListener("visibilitychange", handleVisibilityChange);
			window.addEventListener("focus", handleVisibilityChange);

			return () => {
				document.removeEventListener(
					"visibilitychange",
					handleVisibilityChange,
				);
				window.removeEventListener("focus", handleVisibilityChange);
			};
		}, [focus, isInitialRender]);

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
		}, [reconnect, isInitialRender]);

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
		}, [interval, background, isInitialRender]);
	};
}

const LastResort: Layout = () =>
	import.meta.env.DEV ? (
		<p>
			There is no root page or layout in your page directory. Create one to get
			started.
		</p>
	) : (
		<p>Not found.</p>
	);

const DefaultLayout: SimpleLayout = ({ children }) => <>{children}</>;

const defaultPageGetCacheKey: GetCacheKeyFunc = ({ url, context, params }) => [
	context,
	params,
	url.search,
];

if (import.meta.hot && !(window as any).$rakkas$reloader) {
	(window as any).$rakkas$reloader = {};
}
