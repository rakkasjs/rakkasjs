/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import { ErrorDescription, LayoutLoadResult, ReloadHookParams } from "..";
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
	PageTypes,
	LayoutTypes,
	LoadHelpers,
} from "./types";
import { stableJson } from "./stable-json";
import { toErrorDescription } from "./toErrorDescription";
import { initGlobal } from "./init-global";

import importers from "@rakkasjs/page-imports";

const moduleCache: Record<string, any> = initGlobal("moduleCache", {});
const errorBoundaryCache: Record<string, any> = initGlobal(
	"errorBoundaryCache",
	{},
);

export interface RenderedStackItem {
	Component?:
		| Page<PageTypes>
		| ErrorPage<PageTypes>
		| Layout<LayoutTypes>
		| SimpleLayout<LayoutTypes>;
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
	helpers: LoadHelpers;
}

export interface StackResult {
	params: Record<string, string>;
	status: number;
	content: React.ReactNode;
	rendered: RenderedStackItem[];
	found: boolean;
}

export async function makeComponentStack({
	found,
	url,
	fetch,
	previousRender,
	reload,
	isInitialRender,
	rootContext = {},
	helpers,
}: StackArgs): Promise<StackResult> {
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

	const usedContexts: Record<string, unknown>[] = [];

	for (const [i, moduleId] of stack.entries()) {
		let module = import.meta.env.SSR ? undefined : moduleCache[moduleId];

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

			if (!import.meta.env.SSR) {
				// A trick to preserve component identity between renders
				Component =
					errorBoundaryCache[moduleId] ||
					(errorBoundaryCache[moduleId] = wrapInErrorBoundary(
						Component as any,
					));
			}
		}

		const cacheKey = stableJson(getCacheKey({ url, params, match, context }));
		let loaded: PageLoadResult | LayoutLoadResult;

		if (RAKKAS_BUILD_TARGET === "static" && !import.meta.env.SSR) {
			previousRender = await loadDataScript(url.pathname);
		}

		if (
			// Never reload on the client if static
			(RAKKAS_BUILD_TARGET !== "static" || import.meta.env.SSR) &&
			// No previous render, we're in server side; should reload
			(!previousRender ||
				// Different component; should reload
				!previousRender[i] ||
				(previousRender[i].name && previousRender[i].name !== moduleId) ||
				// Cache key manually invalidated; should reload
				!previousRender[i].cacheKey ||
				// Cache key changed; should reload
				previousRender[i].cacheKey !== cacheKey)
		) {
			if (load) {
				try {
					loaded = await load({ url, params, match, context, fetch, helpers });
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
			loaded = previousRender![i].loaded;
		}

		thisRender.push({
			Component,
			loaded,
			cacheKey,
			name: moduleId,
		});

		status = loaded.status ?? status;

		if ("context" in loaded) {
			context = {
				...context,
				...loaded.context,
			};
		}

		usedContexts.push(context);

		if ("error" in loaded) {
			if (status < 400) status = 500;
			error = loaded.error;
			break;
		} else if ("location" in loaded) {
			status = loaded.status || 301;
			break;
		}
	}

	const successfulRender = thisRender.slice(0);

	if (error) {
		successfulRender.length = errorHandlerIndex + 1;
	}

	if (successfulRender.length === 0) {
		thisRender.push({
			Component: LastResort,
			cacheKey: "",
			loaded: { data: 0 },
		});
	}

	const content = successfulRender.reduceRight((prev, rendered, i) => {
		const reloadThis =
			RAKKAS_BUILD_TARGET === "static" ? noop : () => reload(i);

		const Component = rendered.Component!;

		if (import.meta.hot) {
			window.$rakkas$reloader[rendered.name || ""] = (newModule) => {
				moduleCache[rendered.name || ""] = newModule;
				delete errorBoundaryCache[rendered.name || ""];
				reloadThis();
			};
		}

		const props = {
			url: url,
			match: match,
			params: params,
			context: usedContexts[i],
			data: (rendered.loaded as any).data,
			error: errorHandlerIndex === i ? error : undefined,
			reload: reloadThis,
			useReload:
				RAKKAS_BUILD_TARGET === "static"
					? noop
					: makeUseReload(reloadThis, isInitialRender),
		};

		return <Component {...props}>{prev}</Component>;
	}, null as React.ReactNode);

	return {
		status,
		content,
		rendered: thisRender.map(({ ...rest }) => rest),
		params,
		found: !!match,
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

const LastResort: Layout<LayoutTypes> = () =>
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

async function loadDataScript(path: string) {
	return new Promise<any>((resolve, reject) => {
		if (path === "/") path = "";
		const src = `/__data${path}/index.js`;

		const oldScript = document.getElementById(
			"rakkas-data-script",
		) as HTMLScriptElement;

		if (new URL(oldScript.src).pathname === src) {
			return resolve($rakkas$rendered);
		}

		oldScript.remove();

		const script = document.createElement("script");
		script.id = "rakkas-data-script";

		function handleLoad() {
			script.removeEventListener("load", handleLoad);
			resolve($rakkas$rendered);
		}

		function handleError() {
			script.removeEventListener("error", handleError);
			reject(new Error(`Failed to load script ${src}`));
		}

		script.addEventListener("error", handleError);
		script.addEventListener("load", handleLoad);

		script.src = src;
		document.head.appendChild(script);
	});
}

function noop() {
	// Do nothing
}

if (import.meta.hot && !window.$rakkas$reloader) {
	window.$rakkas$reloader = {};
}
