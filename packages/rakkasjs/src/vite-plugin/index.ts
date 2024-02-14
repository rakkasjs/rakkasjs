import { FilterPattern, PluginOption } from "vite";
import { injectConfig } from "./inject-config";
import { preventViteBuild } from "./prevent-vite-build";
import { vaviteConnect } from "@vavite/connect";
import exposeViteDevServer from "@vavite/expose-vite-dev-server";
import { resolveClientManifest } from "./resolve-client-manifest";
import { virtualDefaultEntry } from "./virtual-default-entry";
import { nodeLoaderPlugin } from "@vavite/node-loader/plugin";

// Feature plugins
import pages from "../features/pages/vite-plugin";
import runServerSide from "../features/run-server-side/vite-plugin";
import { adapters, RakkasAdapter } from "./adapters";
import { serverOnlyClientOnly } from "./server-only-client-only";
import {
	type RakkasPluginApi,
	rakkasPlugins,
	RouteDefinition,
} from "./rakkas-plugins";
import { fsRoutes } from "./fs-routes";
import { routes } from "./routes";

export type { RakkasPluginApi };
export type {
	ApiRouteDefinition,
	CommonRouteDefinition,
	PageRouteDefinition,
	RouteDefinition,
} from "./rakkas-plugins";

declare module "vite" {
	interface Plugin {
		api?: {
			rakkas?: RakkasPluginApi;
		};
	}
}

export interface RakkasOptions {
	/**
	 * Paths to start crawling when prerendering static pages.
	 * `true` is the same as `["/"]` and `false` is the same as `[]`.
	 * @default false
	 */
	prerender?: string[] | boolean;
	/** Whether to enable strict mode in dev. @default true */
	strictMode?: boolean;
	/** Platform adapter */
	adapter?:
		| "node"
		| "cloudflare-workers"
		| "vercel"
		| "vercel-edge"
		| "netlify"
		| "netlify-edge"
		| "deno"
		| "bun"
		| "lagon"
		| RakkasAdapter;
	/**
	 * Filter patterns for server-only files that should not be included in the client bundle.
	 *
	 * @default { include: ["**\/*.server.*", "**\/server/**"] }
	 */
	serverOnlyFiles?: {
		include?: FilterPattern;
		exclude?: FilterPattern;
	};
	/**
	 * Filter patterns for client-only files that should not be included in the server bundle.
	 *
	 * @default { include: ["**\/*.client.*", "**\/client/**"] }
	 */
	clientOnlyFiles?: {
		include?: FilterPattern;
		exclude?: FilterPattern;
	};
	/**
	 * Enable/disable file system routes
	 */
	fsRoutes?: boolean;
	/**
	 * Config-based routes
	 */
	routes?: RouteDefinition[];
	/**
	 * Use Vite runtime to load the server-side code
	 * @experimental
	 * @default false (can be overridden by setting the environment variable USE_VITE_RUNTIME to "true")
	 */
	useViteRuntime?: boolean;
}

export default function rakkas(options: RakkasOptions = {}): PluginOption[] {
	const { fsRoutes: enableFsRoutes = true, routes: customRoutes } = options;
	let { prerender = [], adapter = "node" } = options;

	if (prerender === true) {
		prerender = ["/"];
	} else if (prerender === false) {
		prerender = [];
	}

	if (typeof adapter === "string") {
		adapter = adapters[adapter];
	}

	return [
		globalThis.__vavite_loader__ && nodeLoaderPlugin(),
		...vaviteConnect({
			handlerEntry: "/rakkasjs:node-entry",
			clientAssetsDir: "dist/client",
			serveClientAssetsInDev: true,
			useViteRuntime: options.useViteRuntime,
		}),
		exposeViteDevServer(),

		preventViteBuild(),
		injectConfig({
			prerender,
			adapter,
			strictMode: options.strictMode ?? true,
		}),
		enableFsRoutes && fsRoutes(),
		customRoutes && {
			name: "rakkasjs:custom-routes",
			api: {
				rakkas: {
					getRoutes() {
						return customRoutes!;
					},
				},
			},
		},
		routes(),
		pages(),
		virtualDefaultEntry({
			entry: "/src/entry-node",
			virtualName: "node-entry",
			defaultContent: DEFAULT_NODE_ENTRY_CONTENTS,
		}),
		virtualDefaultEntry({
			entry: "/src/entry-hattip",
			virtualName: "hattip-entry",
			defaultContent: DEFAULT_HATTIP_ENTRY_CONTENTS,
		}),
		virtualDefaultEntry({
			entry: "/src/entry-client",
			virtualName: "client-entry",
			defaultContent: DEFAULT_CLIENT_ENTRY_CONTENTS,
			resolveName: false,
		}),
		virtualDefaultEntry({
			entry: "/src/common-hooks",
			virtualName: "common-hooks",
			defaultContent: DEFAULT_COMMON_HOOKS_CONTENTS,
			resolveName: false,
		}),
		virtualDefaultEntry({
			entry: "/src/routes/$error",
			virtualName: "error-page",
			defaultContent: DEFAULT_ERROR_PAGE_CONTENTS,
		}),
		resolveClientManifest(),
		...runServerSide(),
		serverOnlyClientOnly(options),
		rakkasPlugins(),
	];
}

const DEFAULT_NODE_ENTRY_CONTENTS = `
	import { createMiddleware } from "rakkasjs/node-adapter";
	export default createMiddleware(
		(req, res, next) => import("rakkasjs:hattip-entry").then((m) => m.default(req, res, next)),
	);
`;

const DEFAULT_HATTIP_ENTRY_CONTENTS = `
	import { createRequestHandler } from "rakkasjs/server";
	export default createRequestHandler();
`;

const DEFAULT_CLIENT_ENTRY_CONTENTS = `
	import { startClient } from "rakkasjs/client";
	startClient();
`;

const DEFAULT_COMMON_HOOKS_CONTENTS = `
	export default {};
`;

const DEFAULT_ERROR_PAGE_CONTENTS = `
	export { DefaultErrorPage as default } from "rakkasjs";
`;
