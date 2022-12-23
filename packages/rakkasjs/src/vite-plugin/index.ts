/// <reference types="@vavite/multibuild/vite-config" />

import { PluginOption, ResolvedConfig } from "vite";
import react, { Options as ReactPluginOptions } from "@vitejs/plugin-react";
import { injectConfig } from "./inject-config";
import { preventViteBuild } from "./prevent-vite-build";
import vaviteConnect from "@vavite/connect";
import exposeViteDevServer from "@vavite/expose-vite-dev-server";
import { resolveClientManifest } from "./resolve-client-manifest";
import { virtualDefaultEntry } from "./virtual-default-entry";

// Feature plugins
import apiRoutes from "../features/api-routes/vite-plugin";
import pageRoutes from "../features/pages/vite-plugin";
import runServerSide from "../features/run-server-side/vite-plugin";
import { adapters, RakkasAdapter } from "./adapters";
import { babelTransformClientSidePages } from "../features/run-server-side/implementation/transform/transform-client-page";

export interface RakkasOptions {
	/** Options passed to @vite/plugin-react */
	react?: ReactPluginOptions;
	/** File extensions for pages and layouts @default ["jsx","tsx"] */
	pageExtensions?: string[];
	/**
	 * Paths to start crawling when prerendering static pages.
	 * `true` is the same as `["/"]` and `false` is the same as `[]`.
	 * @default false
	 */
	prerender?: string[] | boolean;
	/**
	 * Route file filter. This function is called for every route file (page,
	 * api, layout, guard, or middleware) and  be used to exclude some routes
	 * from the build or mark them as server-only. Server-only routes don't
	 * ship any client-side code and are rendered on the server.
	 *
	 * `path` is relative to the `src/routes` directory and is in POSIX format
	 * like `login/index.page.tsx`.
	 */
	filterRoutes?: (path: string) => boolean | "server";
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
		| RakkasAdapter;
}

export default function rakkas(options: RakkasOptions = {}): PluginOption[] {
	let { prerender = [], adapter = "node" } = options;
	if (prerender === true) {
		prerender = ["/"];
	} else if (prerender === false) {
		prerender = [];
	}

	if (typeof adapter === "string") {
		adapter = adapters[adapter];
	}

	let resolvedConfig: ResolvedConfig;

	return [
		...vaviteConnect({
			handlerEntry: "/virtual:rakkasjs:node-entry",
			clientAssetsDir: "dist/client",
			serveClientAssetsInDev: true,
		}),
		exposeViteDevServer(),

		preventViteBuild(),
		injectConfig({
			prerender,
			adapter,
			strictMode: options.strictMode ?? true,
		}),
		apiRoutes(),
		pageRoutes({
			pageExtensions: options.pageExtensions,
			filterRoutes: options.filterRoutes,
		}),
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
		{
			name: "rakkasjs:resolve-config",
			configResolved(config) {
				resolvedConfig = config;
			},
		},
		...react({
			...options.react,
			babel(id, opts) {
				const inputOptions =
					typeof options.react?.babel === "function"
						? options.react.babel(id, opts)
						: options.react?.babel;

				if (
					!opts?.ssr &&
					((resolvedConfig as any).api.rakkas.isPage(id) ||
						(resolvedConfig as any).api.rakkas.isLayout(id))
				) {
					return {
						...inputOptions,
						plugins: [
							babelTransformClientSidePages(),
							...(inputOptions?.plugins ?? []),
						],
					};
				} else {
					return inputOptions || {};
				}
			},
		}),
	];
}

const DEFAULT_NODE_ENTRY_CONTENTS = `
	import { createMiddleware } from "rakkasjs/node-adapter";
	export default createMiddleware(
		(req, res, next) => import("virtual:rakkasjs:hattip-entry").then((m) => m.default(req, res, next)),
	);
`;

const DEFAULT_HATTIP_ENTRY_CONTENTS = `
	import { createRequestHandler } from "rakkasjs";
	export default createRequestHandler();
`;

const DEFAULT_CLIENT_ENTRY_CONTENTS = `
	import { startClient } from "rakkasjs";
	startClient();
`;

const DEFAULT_COMMON_HOOKS_CONTENTS = `
	export default {};
`;

const DEFAULT_ERROR_PAGE_CONTENTS = `
	export { DefaultErrorPage as default } from "rakkasjs";
`;
