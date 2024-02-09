import { Plugin } from "vite";

export interface RakkasPluginApi {
	clientHooks?: string | string[];
	serverHooks?: string | string[];
	commonHooks?: string | string[];
	getRoutes?: () => RouteDefinition[] | Promise<RouteDefinition[]>;
	routesChanged?: () => void;
	routesResolved?: (
		routes: ReadonlyArray<RouteDefinition>,
	) => void | Promise<void>;
}

export type RouteDefinition = PageRouteDefinition | ApiRouteDefinition;

export interface PageRouteDefinition extends CommonRouteDefinition {
	type: "page";
	layouts?: string[];
	guards?: string[];
	page: string;
	is404?: boolean;
	renderingMode?: "hydrate" | "server" | "client";
}

export interface ApiRouteDefinition extends CommonRouteDefinition {
	type: "api";
	middleware?: string[];
	handler: string;
}

export interface CommonRouteDefinition {
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
