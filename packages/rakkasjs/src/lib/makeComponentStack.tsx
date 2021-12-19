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

import importers from "virtual:rakkasjs:page-imports";

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
	previousRender?: { locale: string; stack: RenderedStackItem[] };
	reload(i: number): void;
	rootContext: Record<string, unknown>;
	isInitialRender?: boolean;
	locale: string;
	helpers: LoadHelpers;
}

export interface StackResult {
	params: Record<string, string>;
	status: number;
	content: React.ReactNode;
	rendered: RenderedStackItem[];
	found: boolean;
	prerender: boolean;
	crawl: boolean;
}

export interface RedirectResult {
	location: string;
	status: number;
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
	locale,
}: StackArgs): Promise<StackResult | null | RedirectResult> {
	const { stack, params, match } = found;
	const previousStack =
		locale === previousRender?.locale ? previousRender?.stack : undefined;

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

	if (import.meta.env.SSR) {
		for (const [i, moduleId] of [...stack].reverse().entries()) {
			const module = await importers[moduleId]();

			const isPage = match && i === 0;

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
								(module as PageComponentModule | LayoutComponentModule)
									.default || DefaultLayout,
							load: (module as PageComponentModule | LayoutComponentModule)
								.load,
							options: isPage
								? (module as PageComponentModule).pageOptions
								: (module as LayoutComponentModule).layoutOptions,
							getCacheKey:
								(module as PageComponentModule | LayoutComponentModule)
									.getCacheKey || (isPage ? defaultPageGetCacheKey : () => ""),
					  };

			const { options } = moduleExports;

			if (!options) continue;
			if (options.ssr) break;
			if (options.ssr === false) {
				return null;
			}
		}
	}

	let prerender: boolean | undefined;
	let crawl: boolean | undefined;
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

		if (
			// No previous render, we're in server side; should reload
			!previousStack ||
			// Different component; should reload
			!previousStack[i] ||
			(previousStack[i].name && previousStack[i].name !== moduleId) ||
			// Cache key manually invalidated; should reload
			!previousStack[i].cacheKey ||
			// Cache key changed; should reload
			previousStack[i].cacheKey !== cacheKey
		) {
			if (load) {
				try {
					loaded = await load({
						url,
						params,
						match,
						context,
						fetch,
						helpers,
						locale,
					});
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
			loaded = previousStack![i].loaded;
		}

		prerender = prerender ?? loaded.prerender;
		crawl = crawl ?? loaded.crawl;

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
		} else if ("redirect" in loaded) {
			return {
				status: loaded.status || 301,
				location: String(loaded.redirect),
			};
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
		const reloadThis = () => reload(i);

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
			useReload: makeUseReload(reloadThis, isInitialRender),
		};

		return <Component {...props}>{prev}</Component>;
	}, null as React.ReactNode);

	return {
		status,
		content,
		rendered: thisRender.map(({ ...rest }) => rest),
		params,
		found: !!match,
		prerender:
			prerender ?? (RAKKAS_BUILD_TARGET === "static" && status !== 404),
		crawl: crawl ?? true,
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

if (import.meta.hot && !window.$rakkas$reloader) {
	window.$rakkas$reloader = {};
}
