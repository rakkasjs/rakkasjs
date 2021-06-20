/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import { findPage } from "./pages";
import {
	ErrorDescription,
	LayoutLoadResult,
	LoadRedirectResult,
	ReloadHookParams,
} from ".";
import { wrapInErrorBoundary } from "./ErrorBoundary";
import {
	ErrorPage,
	GetCacheKeyFunc,
	LayoutComponentModule,
	Page,
	PageComponentModule,
	PageLoadResult,
} from "./types";
import { Layout, SimpleLayout } from "../dist";
import { hash } from "./hash";
import { toErrorDescription } from "./toErrorDescription";

export interface RenderedStackItem {
	Component?: Page | ErrorPage | Layout | SimpleLayout;
	loaded: PageLoadResult | LayoutLoadResult;
	cacheKey: string;
}

interface StackArgs {
	url: URL;
	fetch: typeof fetch;
	previousRender?: RenderedStackItem[];
	reload(i: number): void;
}

export interface StackResult {
	status: number;
	content: React.ReactNode;
	rendered: RenderedStackItem[];
}

export async function makeComponentStack({
	url,
	fetch,
	previousRender,
	reload,
}: StackArgs): Promise<LoadRedirectResult | StackResult> {
	const { stack, params, match } = findPage(url.pathname);

	let error: ErrorDescription | undefined;
	const thisRender: RenderedStackItem[] = [];
	let context: Record<string, unknown> = {};
	let status = 200;
	let errorHandlerIndex = -1;

	if (!match) {
		error = {
			message: "Page not found",
			status: 404,
		};
	}

	for (const [i, importer] of stack.entries()) {
		const module = await importer();
		const isPage = i === stack.length - 1;

		const moduleExports =
			typeof module.default === "object"
				? {
						Component: module.default.render || DefaultLayout,
						load: module.default.load,
						options: module.default.options,
						getCacheKey:
							module.default.getCacheKey ??
							(isPage ? defaultPageGetCacheKey : defaultLayoutGetCacheKey),
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
								.getCacheKey ??
							(isPage ? defaultPageGetCacheKey : defaultLayoutGetCacheKey),
				  };

		const { load, options, getCacheKey } = moduleExports;
		let Component = moduleExports.Component;

		const canHandleErrors =
			options?.canHandleErrors ?? (!isPage && !!Component);

		if (canHandleErrors) {
			errorHandlerIndex = i;
			// A trick to preserve component identity between renders
			Component =
				(Component as any).$rakkas$wrappedInError ||
				((Component as any).$rakkas$wrappedInError = wrapInErrorBoundary(
					Component as any,
				));
		}

		const cacheKey = hash(getCacheKey({ url, params, match, context }));
		let loaded: PageLoadResult | LayoutLoadResult;

		if (
			// No previous render, we're in server side; should reload
			!previousRender ||
			// Different component; should reload
			!previousRender[i] ||
			(previousRender[i].Component &&
				previousRender[i].Component !== Component) ||
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

	context = {};
	const content = thisRender.reduceRight((prev, rendered, i) => {
		const reloadThis = () => reload(i);
		const Component = rendered.Component!;
		context = { ...context, ...(rendered.loaded as any).context };

		return (
			<Component
				url={url}
				match={match}
				params={params}
				context={context}
				data={(rendered.loaded as any).data}
				error={errorHandlerIndex === i ? error : undefined}
				reload={reloadThis}
				useReload={makeUseReload(reloadThis)}
			>
				{prev}
			</Component>
		);
	}, null as React.ReactNode);

	return {
		status,
		content,
		rendered: thisRender,
	};
}

function makeUseReload(reload: () => void) {
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

			function handleFocus() {
				reload();
			}

			window.addEventListener("focus", handleFocus);

			return () => {
				window.removeEventListener("focus", handleFocus);
			};
		}, [focus]);

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
		}, [reconnect]);

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
		}, [interval, background]);
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

const defaultLayoutGetCacheKey: GetCacheKeyFunc = ({ context }) => context;
