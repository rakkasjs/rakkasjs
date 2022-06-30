import React, {
	createContext,
	Fragment,
	ReactElement,
	useContext,
} from "react";
import { useLocation } from "../features/client-side-navigation/lib";
import { findRoute, RouteMatch } from "../internal/find-route";
import { Layout, PreloadContext, PreloadResult } from "./page-types";
import prodRoutes from "virtual:rakkasjs:client-page-routes";
import { Default404Page } from "../features/pages/Default404Page";
import { QueryContext } from "../lib";
import { IsomorphicContext } from "./isomorphic-context";

export function App() {
	const { current: url } = useLocation();

	// TODO: Warn when a page doesn't export a default component

	const lastRoute = useContext(RouteContext);
	const queryContext = useContext(IsomorphicContext);

	if ("error" in lastRoute) {
		throw lastRoute.error;
	}

	if (!lastRoute.last || lastRoute.last.pathname !== url.pathname) {
		// TODO: Error handling
		throw loadRoute(url, lastRoute.found, false, queryContext)
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
	url: URL,
	lastFound: RouteContextContent["found"],
	try404: boolean,
	queryContext: QueryContext,
) {
	let found = lastFound;

	if (!found) {
		const routes = import.meta.env.PROD
			? prodRoutes
			: // We should dynamically import in dev to allow hot reloading
			  (await import("virtual:rakkasjs:client-page-routes")).default;

		let pathname = url.pathname;
		found = findRoute(routes, pathname);

		while (!found) {
			if (!try404) {
				// Always try a full reload before showing a 404 page
				// the route may be file or an API route.
				window.location.reload();
				await new Promise(() => {
					// Wait forever
				});
			}

			if (!pathname.endsWith("/")) {
				pathname += "/";
			}

			found = findRoute(routes, pathname + "%24404");

			if (pathname === "/") {
				found = {
					params: {},
					route: [/^\/$/, [async () => ({ default: Default404Page })], []],
				};
			}

			// Throw away the last path segment
			pathname = pathname.split("/").slice(0, -2).join("/") || "/";
		}
	}

	const importers = found.route[1];

	const preloadContext: PreloadContext = {
		...queryContext,
		url,
		params: found.params,
	};

	const promises = importers.map(async (importer) =>
		importer().then(async (module) => [
			module.default,
			await module.default.preload?.(preloadContext),
		]),
	) as Promise<[Layout, PreloadResult | undefined]>[];

	const results = await Promise.all(promises);

	const preloaded = results.map((r) => r[1]).reverse();

	const preloadedData: any = {};
	preloaded.forEach((p) => Object.assign(preloadedData, p?.meta));

	const components = results.map(
		(m) => m[0] || (({ children }: any) => children),
	);

	let app = components.reduce(
		(prev, Component) => (
			<Component url={url} params={found!.params} meta={preloadedData}>
				{prev}
			</Component>
		),
		null as any as ReactElement,
	);

	app = (
		<>
			{preloaded.map((result, i) => (
				<Fragment key={i}>{result?.seo || null}</Fragment>
			))}

			{app}
		</>
	);

	return {
		pathname: url.pathname,
		app,
	};
}
