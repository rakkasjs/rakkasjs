import React, { createContext, ReactElement, useContext } from "react";
import { useLocation } from "../features/client-side-navigation/lib";
import { findRoute, RouteMatch } from "../internal/find-route";
import { LayoutModule } from "./page-types";

export function App() {
	const { current: href } = useLocation();

	// TODO: Warn when a page doesn't export a default component

	const lastRoute = useContext(RouteContext);

	const url = new URL(href);

	if (!lastRoute.last || lastRoute.last.pathname !== url.pathname) {
		throw (async () => {
			let found = lastRoute.found;

			if (!found) {
				const routes = (await import("virtual:rakkasjs:client-page-routes"))
					.default;

				found = findRoute(routes, url.pathname);

				if (!found) {
					// TODO: Handle 404
					throw new Error("Page not found");
				}
			}

			const importers = found.route[1];

			const promises = importers.map((importer) =>
				importer(),
			) as Promise<LayoutModule>[];

			const modules = await Promise.all(promises);

			const components = modules.map(
				(m) => m.default || (({ children }: any) => children),
			);

			const app = components.reduce(
				(prev, Component) => (
					<Component children={prev} url={url} params={found!.params} />
				),
				null as any as ReactElement,
			);

			lastRoute.last = {
				pathname: url.pathname,
				app,
			};

			lastRoute.onRendered?.();
		})();
	}

	const app = lastRoute.last.app;

	return app;
}

export const RouteContext = createContext<{
	found?: RouteMatch<
		| typeof import("virtual:rakkasjs:client-page-routes").default[0]
		| typeof import("virtual:rakkasjs:server-page-routes").default[0]
	>;
	last?: {
		pathname: string;
		app: ReactElement;
	};
	onRendered?(): void;
}>({});
