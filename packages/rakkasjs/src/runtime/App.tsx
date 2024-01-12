import React, {
	Fragment,
	ReactElement,
	ReactNode,
	useContext,
	useReducer,
} from "react";
import {
	cancelLastNavigation,
	useLocation,
} from "../features/client-side-navigation/lib";
import { findPage, RouteMatch } from "../internal/find-page";
import {
	Layout,
	LayoutModule,
	PageModule,
	PreloadContext,
	PreloadResult,
} from "./page-types";
import prodRoutes, {
	notFoundRoutes as prodNotFoundRoutes,
} from "virtual:rakkasjs:client-page-routes";
import { Default404Page } from "../features/pages/Default404Page";
import { Head, LookupHookResult, PageContext, Redirect } from "../lib";
import { IsomorphicContext } from "./isomorphic-context";
import { createNamedContext } from "./named-context";
import { prefetcher } from "../features/client-side-navigation/implementation";
import { RouteParamsContext } from "../features/pages/route-params-context";

export interface AppProps {
	beforePageLookupHandlers: Array<
		(ctx: PageContext, url: URL) => LookupHookResult
	>;
	ssrMeta?: any;
	ssrActionData?: any;
	ssrPreloaded?: (void | PreloadResult<Record<string, unknown>>)[];
	ssrModules?: (PageModule | LayoutModule)[];
}

export function App(props: AppProps) {
	const { current: url } = useLocation();

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

	if (!import.meta.env.SSR) (window as any).$RAKKAS_UPDATE = update;

	const pageContext = useContext(IsomorphicContext);

	pageContext.url = new URL(url);
	pageContext.actionData = actionData;

	if (!import.meta.env.SSR) {
		prefetcher.prefetch = function prefetch(location) {
			const url = new URL(location, pageContext.url);
			url.hash = "";

			if (url.origin !== window.location.origin) return;

			loadRoute(
				{ ...pageContext, url },
				lastRoute.found,
				false,
				props.beforePageLookupHandlers,
				actionData,
				props.ssrMeta,
				props.ssrPreloaded,
				props.ssrModules,
				true,
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
		lastRoute.last.pathname !== pageContext.url.pathname ||
		lastRoute.last.search !== pageContext.url.search ||
		// lastRoute.last.actionData !== actionData ||
		forcedUpdate
	) {
		lastRoute.updateCounter = updateCounter;
		throw loadRoute(
			pageContext,
			lastRoute.found,
			false,
			props.beforePageLookupHandlers,
			actionData,
			props.ssrMeta,
			props.ssrPreloaded,
			props.ssrModules,
		)
			.then((route) => {
				lastRoute.last = route;
				lastRoute.onRendered?.();
			})
			.catch(async () => {
				// Try a full reload in case of a mid-session deployment
				window.location.reload();
				await new Promise(() => {
					// Wait forever
				});
			});
	}

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
		| (typeof import("virtual:rakkasjs:client-page-routes").default)[0]
		| (typeof import("virtual:rakkasjs:server-page-routes").default)[0]
	>;
	last?: {
		pathname: string;
		search: string;
		app: ReactElement;
		actionData: any;
	};
	onRendered?(): void;
	error?: unknown;
	updateCounter?: number;
}

export async function loadRoute(
	pageContext: PageContext,
	lastFound: RouteContextContent["found"],
	try404: boolean,
	beforePageLookupHandlers: Array<
		(ctx: PageContext, url: URL) => LookupHookResult
	>,
	actionData: any,
	ssrMeta?: any,
	ssrPreloaded?: (void | PreloadResult<Record<string, unknown>>)[],
	ssrModules?: (PageModule | LayoutModule)[],
	prefetchOnly = false,
) {
	let found = lastFound;
	const { pathname: originalPathname } = pageContext.url;

	for (const hook of beforePageLookupHandlers) {
		const result = hook(pageContext, pageContext.url);

		if (!result) break;
		if (result === true) continue;

		if ("redirect" in result) {
			const location = String(result.redirect);
			return {
				pathname: originalPathname,
				search: pageContext.url.search,
				actionData,
				app: (
					<Redirect
						href={location}
						status={result.status}
						permanent={result.permanent}
					/>
				),
			};
		} else {
			// Rewrite
			pageContext.url = new URL(result.rewrite, pageContext.url);
		}
	}

	let updatedComponents: Layout[] | undefined;

	if (!found || import.meta.hot) {
		let routes: typeof prodRoutes;
		let updatedRoutes: typeof prodRoutes;
		let notFoundRoutes: typeof prodNotFoundRoutes;
		let updatedNotFoundRoutes: typeof prodNotFoundRoutes;

		if (import.meta.env.PROD) {
			routes = prodRoutes;
			notFoundRoutes = prodNotFoundRoutes;
		} else {
			// This whole dance is about rendering the old component (which
			// React updates internally via Fast Refresh), but calling the
			// preload function of the new component.
			const updatedModule = await import("virtual:rakkasjs:client-page-routes");
			routes = updatedModule.default;
			notFoundRoutes = updatedModule.notFoundRoutes;

			if (import.meta.hot) {
				// TODO: This leaks memory
				const updatedModule =
					// ESBuild strips vite-ignore comments, so we have to use
					// eval to make Vite ignore this import.
					await (0, eval)(
						`import("/virtual:rakkasjs:client-page-routes?" + Date.now())`,
					);
				updatedRoutes = updatedModule.default;
				updatedNotFoundRoutes = updatedModule.notFoundRoutes;
			}
		}

		let pathname = pageContext.url.pathname;
		let result = findPage(routes, pathname, pageContext);

		if (import.meta.hot && !result) {
			result = findPage(updatedRoutes!, pathname, pageContext);
		}

		if (result && "redirect" in result) {
			const location = String(result.redirect);
			return {
				pathname: originalPathname,
				search: pageContext.url.search,
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
				cancelLastNavigation();
				await new Promise((resolve) => {
					window.addEventListener("popstate", resolve, { once: true });
				});

				location.assign(pageContext.url.href);
				await new Promise(() => {
					// Wait forever
				});
			}

			if (!pathname.endsWith("/")) {
				pathname += "/";
			}

			const result = findPage(notFoundRoutes, pathname + "$404");
			if (import.meta.hot && !result) {
				findPage(updatedNotFoundRoutes!, pathname + "$404");
			}

			found = result;

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
				};
			}

			// Throw away the last path segment
			pathname = pathname.split("/").slice(0, -2).join("/") || "/";
		}

		if (import.meta.hot) {
			const foundIndex = routes.findIndex((route) => route === found!.route);
			const updatedRoute = updatedRoutes![foundIndex];
			if (updatedRoute) {
				updatedComponents = (await Promise.all(
					updatedRoute?.[1].map((importer) =>
						importer().then((module) => module.default),
					),
				)) as any;
			}
		}
	}

	const importers = found.route[1];

	const preloadContext: PreloadContext = {
		...pageContext,
		params: found.params,
	};

	const promises = importers.map(async (importer, i) =>
		Promise.resolve(ssrModules?.[importers.length - 1 - i] || importer()).then(
			async (module) => {
				if (prefetchOnly) return;

				const preload =
					import.meta.hot && updatedComponents
						? updatedComponents[i]?.preload
						: module.default?.preload;

				try {
					if (
						!import.meta.env.SSR &&
						i === (window as any).$RAKKAS_ACTION_ERROR_INDEX
					) {
						delete (window as any).$RAKKAS_ACTION_ERROR_INDEX;
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
	let preloadNode: ReactNode[] = [];

	if (import.meta.env.SSR) {
		meta = ssrMeta;
		preloadNode = ssrPreloaded!
			.map((result, i) => {
				return (
					(result?.head || result?.redirect) && (
						<Fragment key={i}>
							{<Head {...result?.head} />}
							{result?.redirect && <Redirect {...result?.redirect} />}
						</Fragment>
					)
				);
			})
			.filter(Boolean);
	} else {
		const preloaded = layoutStack.map((r) => r[1]).reverse();

		meta = {};
		preloaded.forEach((p) =>
			typeof p?.meta === "function"
				? p.meta(meta)
				: Object.assign(meta, p?.meta),
		);

		preloadNode = preloaded
			.map(
				(result, i) =>
					(result?.head || result?.redirect) && (
						<Fragment key={i}>
							{<Head {...result?.head} />}
							{result?.redirect && <Redirect {...result?.redirect} />}
						</Fragment>
					),
			)
			.filter(Boolean);
	}

	// If it's a forced update due to hot module
	// reloading, we'll reuse the components from the
	// previous render.
	const components = layoutStack.map(
		(m) => m[0] || (({ children }: any) => children),
	);

	let app = components.reduce(
		(prev, Component) => (
			<Component
				url={pageContext.url}
				params={found!.params}
				meta={meta}
				actionData={actionData}
			>
				{prev}
			</Component>
		),
		null as any as ReactElement,
	);

	app = (
		<RouteParamsContext.Provider value={found.params}>
			{preloadNode}
			{app}
		</RouteParamsContext.Provider>
	);

	return {
		pathname: originalPathname,
		search: pageContext.url.search,
		actionData,
		app,
	};
}

if (import.meta.hot) {
	import.meta.hot.accept("/@id/virtual:rakkasjs:client-page-routes", () => {
		// Ignore
	});
}
