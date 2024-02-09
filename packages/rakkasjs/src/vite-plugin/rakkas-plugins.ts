import { Plugin } from "vite";

export interface RakkasPluginApi {
	/**
	 * A module ID, or a list of module IDs, that export a function
	 * that returns client-side hooks.
	 */
	clientHooks?: string | string[];
	/**
	 * A module ID, or a list of module IDs, that export a function
	 * that returns server-side hooks.
	 */
	serverHooks?: string | string[];
	/**
	 * A module ID, or a list of module IDs, that export a function
	 * that returns common hooks.
	 */
	commonHooks?: string | string[];
	/**
	 * Create routes for the application.
	 */
	getRoutes?: () => RouteDefinition[] | Promise<RouteDefinition[]>;
	/**
	 * If you build an alternative routing system, you can use this hook to
	 * notify Rakkas that the routes have changed. Loop through all the plugins
	 * in the resolved config and call this hook. Rakkas will then rerun all
	 * `getRoutes` hooks and will finally call `routesResolved` hooks.
	 */
	routesChanged?: () => void;
	/**
	 * Called when the routes are resolved.
	 */
	routesResolved?: (
		routes: ReadonlyArray<RouteDefinition>,
	) => void | Promise<void>;
}

export type RouteDefinition = PageRouteDefinition | ApiRouteDefinition;

export interface PageRouteDefinition extends CommonRouteDefinition {
	/** The type of the route */
	type: "page";
	/** Layout modules, outermost first */
	layouts?: string[];
	/** Guard modules, in order of execution */
	guards?: string[];
	/** Page module */
	page: string;
	/** Is this a 404 page? @default false */
	is404?: boolean;
	/** Rendering mode. @default "hydrate" */
	renderingMode?: "hydrate" | "server" | "client";
}

export interface ApiRouteDefinition extends CommonRouteDefinition {
	/** The type of the route */
	type: "api";
	/** Middleware modules, outermost first */
	middleware?: string[];
	/** API module */
	handler: string;
}

export interface CommonRouteDefinition {
	/** The path pattern for the route */
	path: string;
}

export function rakkasPlugins(): Plugin {
	const rakkasApis: RakkasPluginApi[] = [];

	return {
		name: "rakkasjs:rakkas-plugins",

		configResolved(config) {
			for (const plugin of config.plugins) {
				if (plugin.api?.rakkas) {
					rakkasApis.push(plugin.api.rakkas);
				}
			}
		},

		resolveId(source) {
			if (
				[
					"rakkasjs:plugin-server-hooks",
					"rakkasjs:plugin-client-hooks",
					"rakkasjs:plugin-common-hooks",
				].includes(source)
			) {
				return "\0virtual:" + source;
			}
		},

		load(id) {
			if (id === "\0virtual:rakkasjs:plugin-server-hooks") {
				return makeModule(rakkasApis.map((api) => api.serverHooks));
			}

			if (id === "\0virtual:rakkasjs:plugin-client-hooks") {
				return makeModule(rakkasApis.map((api) => api.clientHooks));
			}

			if (id === "\0virtual:rakkasjs:plugin-common-hooks") {
				return makeModule(rakkasApis.map((api) => api.commonHooks));
			}
		},
	};
}

function makeModule(hooks: Array<undefined | string | string[]>) {
	const normalizedHooks = hooks
		.filter((hook) => hook !== undefined)
		.flat() as string[];

	let result = "";
	let i = 1;
	for (const hook of normalizedHooks) {
		result += `import p${i++} from ${JSON.stringify(hook)};\n`;
	}

	result += `\n\nexport default [\n`;
	normalizedHooks.forEach((_hook, i) => {
		result += `\tp${i + 1},\n`;
	});

	result += "];\n";

	return result;
}
