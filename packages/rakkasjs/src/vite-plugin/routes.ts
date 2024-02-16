import { Plugin, ViteDevServer } from "vite";
import {
	ApiRouteDefinition,
	PageRouteDefinition,
	RouteDefinition,
} from "./rakkas-plugins";
import { routeToRegExp, sortRoutes } from "../internal/route-utils";

export function routes(): Plugin {
	let plugins: Readonly<Plugin[]>;
	let server: ViteDevServer;

	let routes: RouteDefinition[] = [];

	function invalidateModuleByName(name: string) {
		const module = server.moduleGraph.getModuleById(name);
		if (module) {
			server.moduleGraph.invalidateModule(module);
		}
	}

	let debouncing = false;

	async function routesResolved() {
		routes = sortRoutes(routes.map((route) => [route.path, route])).map(
			(r) => r[1],
		);

		for (const plugin of plugins) {
			await plugin.api?.rakkas?.routesResolved?.(routes);
		}
	}

	return {
		name: "rakkasjs:routes",

		resolveId(source) {
			if (routeFileNames.includes(source)) {
				return "\0virtual:" + source;
			}
		},

		api: {
			rakkas: {
				async routesChanged() {
					if (debouncing) {
						return;
					}

					try {
						debouncing = true;
						await new Promise((resolve) => setTimeout(resolve, 100));
					} finally {
						debouncing = false;
					}

					routes = await collectRoutes(plugins);

					invalidateModuleByName("\0virtual:rakkasjs:server-page-routes");
					invalidateModuleByName("\0virtual:rakkasjs:client-page-routes");
					invalidateModuleByName("\0virtual:rakkasjs:api-routes");

					await routesResolved();

					// eslint-disable-next-line deprecation/deprecation
					const hot = server.hot ?? server.ws;
					if (hot) {
						hot.send({
							type: "full-reload",
							path: "*",
						});
					}
				},
			},
		},

		async configResolved(config) {
			plugins = config.plugins;
			routes = await collectRoutes(plugins);
			await routesResolved();
		},

		async load(id) {
			if (id === "\0virtual:rakkasjs:server-page-routes") {
				return generateServerPageRoutesModule(routes);
			} else if (id === "\0virtual:rakkasjs:client-page-routes") {
				return generateClientPageRoutesModule(routes);
			} else if (id === "\0virtual:rakkasjs:api-routes") {
				return generateApiRoutesModule(routes);
			}
		},

		configureServer(devServer) {
			server = devServer;
		},
	};
}

const routeFileNames = [
	"rakkasjs:server-page-routes",
	"rakkasjs:client-page-routes",
	"rakkasjs:api-routes",
];

async function collectRoutes(plugins: Readonly<Plugin[]>) {
	const routes: RouteDefinition[] = [];
	for (const plugin of plugins) {
		const newRoutes = await plugin.api?.rakkas?.getRoutes?.();
		if (newRoutes) {
			routes.push(...newRoutes);
		}
	}

	return routes;
}

function generateServerPageRoutesModule(routes: RouteDefinition[]) {
	const pages = routes.filter(
		(route) => route.type === "page",
		// && route.renderingMode !== "server",
	) as PageRouteDefinition[];

	const layouts = new Set<string>();
	const guards = new Set<string>();
	for (const page of pages) {
		for (const layout of page.layouts || []) {
			layouts.add(layout);
		}
		for (const guard of page.guards || []) {
			guards.add(guard);
		}
	}

	let result = "";

	let li = 0;
	const layoutNameMap = new Map<string, number>();
	for (const layout of layouts) {
		layoutNameMap.set(layout, li);
		result += `const l${li} = () => import(${JSON.stringify(layout)});\n`;
		li++;
	}

	let gi = 0;
	const guardNameMap = new Map<string, number>();
	for (const guard of guards) {
		guardNameMap.set(guard, gi);
		result += `import { pageGuard as g${gi} } from ${JSON.stringify(guard)};\n`;
		gi++;
	}

	const pageNameMap = new Map<string, number>();
	for (const [pi, page] of pages.entries()) {
		result += `const p${pi} = () => import(${JSON.stringify(page.page)});\n`;
		pageNameMap.set(page.page, pi);
	}

	function generateExports(pages: PageRouteDefinition[]) {
		for (const page of pages) {
			const pi = pageNameMap.get(page.page)!;
			result += "  [";
			const [re, restName] = routeToRegExp(page.path);
			result += re.toString() + ", ";
			const importers = [
				`p${pi}`,
				...(
					page.layouts?.map((layout) => "l" + layoutNameMap.get(layout)!) || []
				).reverse(),
			];
			result += "[" + importers.join(", ") + "], ";

			const guards = page.guards?.map(
				(guard) => "g" + guardNameMap.get(guard)!,
			);

			if (guards) {
				result += "[" + guards.join(", ") + "], ";
			} else {
				result += ", ";
			}

			if (restName) {
				result += JSON.stringify(restName) + ", ";
			} else {
				result += ", ";
			}

			const ids =
				"[" +
				[page.page, ...(page.layouts || [])]
					.map((name) => JSON.stringify(name))
					.join(", ") +
				"],\n";

			result += ids;

			if (page.renderingMode === "server") {
				result += "1, ";
			} else if (page.renderingMode === "client") {
				result += "2, ";
			}

			result += "],\n";
		}
	}

	result += "export default [";
	generateExports(pages.filter((page) => !page.is404));
	result += "];\n";

	result += "export const notFoundRoutes = [";
	generateExports(pages.filter((page) => page.is404));
	result += "];\n";

	return result;
}

function generateClientPageRoutesModule(routes: RouteDefinition[]) {
	const pages = routes.filter(
		(route) => route.type === "page" && route.renderingMode !== "server",
	) as PageRouteDefinition[];

	const layouts = new Set<string>();
	const guards = new Set<string>();
	for (const page of pages) {
		for (const layout of page.layouts || []) {
			layouts.add(layout);
		}
		for (const guard of page.guards || []) {
			guards.add(guard);
		}
	}

	let result = "";

	let li = 0;
	const layoutNameMap = new Map<string, number>();
	for (const layout of layouts) {
		layoutNameMap.set(layout, li);
		result += `const l${li} = () => import(${JSON.stringify(layout)});\n`;
		li++;
	}

	let gi = 0;
	const guardNameMap = new Map<string, number>();
	for (const guard of guards) {
		guardNameMap.set(guard, gi);
		result += `import { pageGuard as g${gi} } from ${JSON.stringify(guard)};\n`;
		gi++;
	}

	const pageNameMap = new Map<string, number>();
	for (const [pi, page] of pages.entries()) {
		result += `const p${pi} = () => import(${JSON.stringify(page.page)});\n`;
		pageNameMap.set(page.page, pi);
	}

	function generateExports(pages: PageRouteDefinition[]) {
		for (const page of pages) {
			const pi = pageNameMap.get(page.page)!;
			result += "  [";
			const [re, restName] = routeToRegExp(page.path);
			result += re.toString() + ", ";
			const importers = [
				`p${pi}`,
				...(
					page.layouts?.map((layout) => "l" + layoutNameMap.get(layout)!) || []
				).reverse(),
			];
			result += "[" + importers.join(", ") + "], ";

			const guards = page.guards?.map(
				(guard) => "g" + guardNameMap.get(guard)!,
			);

			if (guards) {
				result += "[" + guards.join(", ") + "], ";
			} else {
				result += ", ";
			}

			if (restName) {
				result += JSON.stringify(restName) + ", ";
			} else {
				result += ", ";
			}

			result += "],\n";
		}
	}

	result += "export default [";
	generateExports(pages.filter((page) => !page.is404));
	result += "];\n";

	result += "export const notFoundRoutes = [";
	generateExports(pages.filter((page) => page.is404));
	result += "];\n";

	return result;
}

function generateApiRoutesModule(routes: RouteDefinition[]) {
	const apiRoutes = routes.filter(
		(route) => route.type === "api",
	) as ApiRouteDefinition[];

	const middlewares = new Set<string>();
	for (const route of apiRoutes) {
		for (const middleware of route.middleware || []) {
			middlewares.add(middleware);
		}
	}

	let result = "";

	let mi = 0;
	const middlewareNameMap = new Map<string, number>();
	for (const middleware of middlewares) {
		middlewareNameMap.set(middleware, mi);
		result += `const m${mi} = () => import(${JSON.stringify(middleware)});\n`;
		mi++;
	}

	for (const [ei, route] of apiRoutes.entries()) {
		result += `const e${ei} = () => import(${JSON.stringify(route.handler)});\n`;
	}

	result += "export default [";

	for (const [ei, route] of apiRoutes.entries()) {
		result += "  [";

		const [re, restName] = routeToRegExp(route.path);
		result += re.toString() + ", ";
		const importers =
			route.middleware
				?.map((middleware) => "m" + middlewareNameMap.get(middleware)!)
				.reverse() || [];
		importers.unshift(`e${ei}`);

		result += "[" + importers.join(", ") + "], ";

		if (restName) {
			result += JSON.stringify(restName) + ", ";
		}

		result += "],\n";
	}

	result += "];\n";

	return result;
}
