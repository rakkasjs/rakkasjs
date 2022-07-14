import React, {
	createContext,
	Fragment,
	ReactElement,
	ReactNode,
	useContext,
} from "react";
import { useLocation } from "../features/client-side-navigation/lib";
import { findRoute, RouteMatch } from "../internal/find-route";
import { Layout, PreloadContext, PreloadResult } from "./page-types";
import prodRoutes from "virtual:rakkasjs:client-page-routes";
import { Default404Page } from "../features/pages/Default404Page";
import { BeforeRouteResult, PageContext, Redirect } from "../lib";
import { IsomorphicContext } from "./isomorphic-context";

export interface AppProps {
	beforeRouteHandlers: Array<(ctx: PageContext, url: URL) => BeforeRouteResult>;
	ssrMeta?: any;
}

export function App(props: AppProps) {
	const { current: url } = useLocation();

	// TODO: Warn when a page doesn't export a default component

	const lastRoute = useContext(RouteContext);
	const pageContext = useContext(IsomorphicContext);

	pageContext.url = new URL(url);

	if ("error" in lastRoute) {
		throw lastRoute.error;
	}

	if (!lastRoute.last || lastRoute.last.pathname !== pageContext.url.pathname) {
		throw loadRoute(
			pageContext,
			lastRoute.found,
			false,
			props.beforeRouteHandlers,
			props.ssrMeta,
		)
			.then((route) => {
				lastRoute.last = route;
				lastRoute.onRendered?.();
			})
			.catch((error) => {
				lastRoute.error = error;
			});
	}

	const app = lastRoute.last.app;

	return app;
}

export const RouteContext = createContext<RouteContextContent>({});

interface RouteContextContent {
	found?: RouteMatch<
		| typeof import("virtual:rakkasjs:client-page-routes").default[0]
		| typeof import("virtual:rakkasjs:server-page-routes").default[0]
	>;
	last?: {
		pathname: string;
		app: ReactElement;
	};
	onRendered?(): void;
	error?: unknown;
}

export async function loadRoute(
	pageContext: PageContext,
	lastFound: RouteContextContent["found"],
	try404: boolean,
	beforeRouteHandlers: Array<(ctx: PageContext, url: URL) => BeforeRouteResult>,
	ssrMeta?: any,
) {
	let found = lastFound;
	const { pathname: originalPathname } = pageContext.url;

	if (!found) {
		for (const hook of beforeRouteHandlers) {
			const result = hook(pageContext, pageContext.url);

			if (!result) continue;

			if ("redirect" in result) {
				const location = String(result.redirect);
				return {
					pathname: originalPathname,
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

		const routes = import.meta.env.PROD
			? prodRoutes
			: // We should dynamically import in dev to allow hot reloading
			  (await import("virtual:rakkasjs:client-page-routes")).default;

		let pathname = pageContext.url.pathname;
		found = findRoute(routes, pathname, pageContext);

		while (!found) {
			if (!try404) {
				// Always try a full reload before showing a 404 page
				// the route may be a static file or an API route.
				window.location.reload();
				await new Promise(() => {
					// Wait forever
				});
			}

			if (!pathname.endsWith("/")) {
				pathname += "/";
			}

			found = findRoute(routes, pathname + "%24404");

			if (!found && pathname === "/") {
				found = {
					params: {},
					route: [/^\/$/, [async () => ({ default: Default404Page })], [], []],
				};
			}

			// Throw away the last path segment
			pathname = pathname.split("/").slice(0, -2).join("/") || "/";
		}
	}

	const importers = found.route[1];

	const preloadContext: PreloadContext = {
		...pageContext,
		params: found.params,
	};

	const promises = importers.map(async (importer) =>
		importer().then(async (module) => [
			module.default,
			await module.default?.preload?.(preloadContext),
		]),
	) as Promise<[Layout, PreloadResult | undefined]>[];

	const layoutStack = await Promise.all(promises);

	let meta: any;
	let preloadNode: ReactNode;

	if (import.meta.env.SSR) {
		meta = ssrMeta;
		preloadNode = null;
	} else {
		const preloaded = layoutStack.map((r) => r[1]).reverse();

		meta = {};
		preloaded.forEach((p) => Object.assign(meta, p?.meta));

		preloadNode = preloaded.map((result, i) => (
			<Fragment key={i}>
				{result?.head}
				{result?.redirect && <Redirect {...result?.redirect} />}
			</Fragment>
		));
	}

	const components = layoutStack.map(
		(m) => m[0] || (({ children }: any) => children),
	);

	let app = components.reduce(
		(prev, Component) => (
			<Component url={pageContext.url} params={found!.params} meta={meta}>
				{prev}
			</Component>
		),
		null as any as ReactElement,
	);

	app = (
		<>
			{preloadNode}
			{app}
		</>
	);

	return {
		pathname: originalPathname,
		app,
	};
}
