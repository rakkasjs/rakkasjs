import React, {
	type ReactElement,
	useContext,
	useDeferredValue,
	useEffect,
	useReducer,
	useState,
} from "react";
import { useLocation } from "../features/client-side-navigation/lib";
import { findPage, type RouteMatch } from "../internal/find-page";
import type {
	Layout,
	LayoutModule,
	PageModule,
	PreloadContext,
	PreloadResult,
} from "./page-types";
import { Default404Page } from "../features/pages/Default404Page";
import { Head, type PageContext, Redirect } from "../lib";
import { IsomorphicContext } from "./isomorphic-context";
import { createNamedContext } from "./named-context";
import {
	LocationContext,
	prefetcher,
} from "../features/client-side-navigation/implementation/link";
import {
	RenderedUrlContext,
	RouteParamsContext,
} from "../features/pages/contexts";
import {
	navigationResolve,
	restoreScrollPosition,
} from "../features/client-side-navigation/implementation/history";

export interface AppProps {
	ssrMeta?: any;
	ssrActionData?: any;
	ssrPreloaded?: (void | PreloadResult<Record<string, unknown>>)[];
	ssrModules?: (PageModule | LayoutModule)[];
}

function useCurrentUrl() {
	const ssrHref = useContext(LocationContext);
	return new URL(import.meta.env.SSR ? ssrHref! : location.href);
}

export function App(props: AppProps) {
	const [id, setId] = useState("initial");

	const currentUrl = useCurrentUrl();
	if (typeof rakkas !== "undefined") {
		rakkas.setNextId = setId;
	}

	const lastRoute = useContext(RouteContext);
	// Force update
	const [updateCounter, update] = useReducer(
		(old) => (old + 1) & 0xfff_ffff,
		0,
	);
	const forcedUpdate = (lastRoute.updateCounter || 0) !== updateCounter;

	const actionData = import.meta.env.SSR
		? props.ssrActionData
		: history.state?.actionData;

	// TODO: Warn when a page doesn't export a default component

	if (!import.meta.env.SSR) rakkas.update = update;

	const pageContext = useContext(IsomorphicContext);

	pageContext.actionData = actionData;

	if (!import.meta.env.SSR) {
		prefetcher.prefetch = function prefetch(location, preload) {
			const url = new URL(location, currentUrl);
			url.hash = "";

			if (url.origin !== window.location.origin) return;

			loadRoute(
				pageContext,
				url,
				lastRoute.found,
				false,
				actionData,
				props.ssrMeta,
				props.ssrPreloaded,
				props.ssrModules,
				preload ? "preload" : true,
			).catch((e) => {
				console.error(e);
			});
		};
	}

	if ("error" in lastRoute) {
		throw lastRoute.error;
	}

	if (
		!lastRoute.last ||
		(lastRoute.last.id !== undefined && lastRoute.last.id !== id) ||
		forcedUpdate
	) {
		lastRoute.updateCounter = updateCounter;
		throw loadRoute(
			pageContext,
			currentUrl,
			lastRoute.found,
			false,
			actionData,
			props.ssrMeta,
			props.ssrPreloaded,
			props.ssrModules,
		)
			.then((route) => {
				lastRoute.last = route && { id, ...route };
			})
			.catch(async () => {
				// Try a full reload in case of a mid-session deployment
				window.location.reload();
				await new Promise(() => {
					// Wait forever
				});
			});
	}

	lastRoute.last!.id = id;

	const app = lastRoute.last.app;

	return app;
}

export const RouteContext = createNamedContext<RouteContextContent>(
	"RouteContext",
	{
		updateCounter: 0,
	},
);

interface RouteContextContent {
	found?: RouteMatch<
		| (typeof import("rakkasjs:client-page-routes").default)[0]
		| (typeof import("rakkasjs:server-page-routes").default)[0]
	>;
	last?: {
		id?: string;
		pathname: string;
		search: string;
		app: ReactElement;
		actionData: any;
	};
	error?: unknown;
	updateCounter?: number;
}

export async function loadRoute(
	pageContext: PageContext,
	url: URL,
	lastFound: RouteContextContent["found"],
	try404: boolean,
	actionData: any,
	ssrMeta?: any,
	ssrPreloaded?: (void | PreloadResult<Record<string, unknown>>)[],
	ssrModules?: (PageModule | LayoutModule)[],
	prefetchOnly: boolean | "preload" = false,
) {
	let found = lastFound;
	const { pathname: originalPathname } = url;

	let updatedComponents: Layout[] | undefined;

	if (!found || import.meta.hot) {
		// WARNING!: This *must* be a dynamic import otherwise
		// cyclic dependencies will break many things.
		const prodModule = await import("rakkasjs:client-page-routes");

		const routes = prodModule.default;
		const notFoundRoutes = prodModule.notFoundRoutes;

		let pathname = url.pathname;
		const result = await findPage(routes, url, pathname, pageContext, false);

		if (result && "redirect" in result) {
			const location = String(result.redirect);
			return {
				pathname: originalPathname,
				search: url.search,
				actionData,
				app: (
					<Redirect
						href={location}
						status={result.status}
						permanent={result.permanent}
					/>
				),
			};
		}

		found = result;

		while (!found) {
			if (prefetchOnly) return;

			if (!try404) {
				// Always try a full reload before showing a 404 page
				// the route may be a static file or an API route.

				location.assign(url.href);
				await new Promise(() => {
					// Wait forever
				});
			}

			if (!pathname.endsWith("/")) {
				pathname += "/";
			}

			const result = await findPage(
				notFoundRoutes,
				url,
				pathname + "$404",
				pageContext,
				true,
			);

			if (result && "redirect" in result) {
				location.assign(result.redirect);
				await new Promise(() => {});
			}

			found = result as any;

			if (!found && pathname === "/") {
				found = {
					params: {},
					route: [
						/^\/$/,
						[async () => ({ default: Default404Page })],
						[],
						undefined,
						[],
					],
					renderedUrl: url,
				};
			}

			// Throw away the last path segment
			pathname = pathname.split("/").slice(0, -2).join("/") || "/";
		}
	}

	const importers = found.route[1];

	const preloadContext: PreloadContext = {
		...pageContext,
		url,
		renderedUrl: found.renderedUrl,
		params: found.params,
	};

	const promises = importers.map(async (importer, i) =>
		Promise.resolve(ssrModules?.[importers.length - 1 - i] || importer()).then(
			async (module) => {
				if (prefetchOnly === true) return;

				const preload =
					import.meta.hot && updatedComponents
						? updatedComponents[i]?.preload
						: module.default?.preload;

				try {
					if (!import.meta.env.SSR && i === rakkas.actionErrorIndex) {
						delete rakkas.actionErrorIndex;
						throw new Error("Action error");
					}
					const preloaded =
						ssrPreloaded?.[i] ?? (await preload?.(preloadContext));

					return [module.default, preloaded];
				} catch (preloadError) {
					// If a preload function throws, we return a component that
					// throws the same error so that the error boundary can catch
					// it.
					return [
						() => {
							throw preloadError;
						},
					];
				}
			},
		),
	) as Promise<[Layout, PreloadResult | undefined]>[];

	const layoutStack = await Promise.all(promises);
	if (prefetchOnly) return;

	let meta: any;
	let preloaded = ssrPreloaded!;

	if (import.meta.env.SSR) {
		meta = ssrMeta;
	} else {
		preloaded = layoutStack.map((r) => r[1]).reverse();

		meta = {};
		preloaded.forEach((p) =>
			typeof p?.meta === "function"
				? p.meta(meta)
				: Object.assign(meta, p?.meta),
		);
	}

	// If it's a forced update due to hot module
	// reloading, we'll reuse the components from the
	// previous render.
	const components = layoutStack.map(
		(m) => m[0] || (({ children }: any) => children),
	);

	const errorFiles = new Set<string>();

	let app = components.reduce(
		(prev, Component, i) => {
			if (import.meta.env.DEV && typeof Component === "object") {
				errorFiles.add((Component as any).moduleId);
				Component = ({ children }) => children;
			}

			const preloadResult = preloaded[components.length - i - 1];

			return (
				<>
					{preloadResult?.head && <Head {...preloadResult.head} />}
					<Component
						url={url}
						renderedUrl={found!.renderedUrl}
						params={found!.params}
						meta={meta}
						actionData={actionData}
					>
						{prev}
					</Component>
				</>
			);
		},
		null as any as ReactElement,
	);

	if (import.meta.env.DEV && !import.meta.env.SSR && errorFiles.size) {
		const message = `The following files don't have a default export:\n\n${[
			...errorFiles,
		].join("\n")}`;

		await (0, eval)(`(async (message) => {
			const { ErrorOverlay } = await import("/@vite/client");
			document.querySelectorAll("vite-error-overlay").forEach((n) => n.close());
			const error = new Error(message);
			error.stack = message;
			document.body.appendChild(new ErrorOverlay(error))
		})`)(message);
	}

	const preloadedRedirect = preloaded.find((p) => p?.redirect)?.redirect;

	app = (
		<RenderedUrlContext.Provider value={found.renderedUrl}>
			<RouteParamsContext.Provider value={found.params}>
				{preloadedRedirect && <Redirect {...preloadedRedirect} />}
				{app}
				<Finish />
			</RouteParamsContext.Provider>
		</RenderedUrlContext.Provider>
	);

	return {
		pathname: originalPathname,
		search: url.search,
		actionData,
		app,
	};
}

function Finish() {
	const resolve = navigationResolve;

	useEffect(() => {
		resolve?.();
	}, [resolve]);

	return <Scroll />;
}

function Scroll() {
	const { pending } = useLocation();
	const href = useDeferredValue(pending?.href);

	useEffect(() => {
		if (!href) {
			restoreScrollPosition();
		}
	}, [href]);

	return null;
}

if (import.meta.hot) {
	import.meta.hot.accept("/@id/rakkasjs:client-page-routes", () => {
		// Ignore
	});
}
