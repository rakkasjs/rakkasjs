import React, { createContext, ReactElement, useContext } from "react";
import { useLocation } from "../features/client-side-navigation/lib";
import { findRoute, RouteMatch } from "../internal/find-route";
import { LayoutModule } from "./page-types";
import prodRoutes from "virtual:rakkasjs:client-page-routes";
import { Default404Page } from "../features/pages/Default404Page";

export function App() {
	const { current: url } = useLocation();

	// TODO: Warn when a page doesn't export a default component

	const lastRoute = useContext(RouteContext);

	if ("error" in lastRoute) {
		throw lastRoute.error;
	}

	if (!lastRoute.last || lastRoute.last.pathname !== url.pathname) {
		// TODO: Error handling
		throw loadRoute(url, lastRoute.found)
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
	lastFound?: RouteContextContent["found"],
	try404 = false,
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

	const promises = importers.map(async (importer) =>
		importer(),
	) as Promise<LayoutModule>[];

	const modules = await Promise.all(promises);

	const components = modules.map(
		(m) => m.default || (({ children }: any) => children),
	);

	const app = components.reduce(
		(prev, Component) => (
			<Component url={url} params={found!.params}>
				{prev}
			</Component>
		),
		null as any as ReactElement,
	);

	return {
		pathname: url.pathname,
		app,
	};
}
