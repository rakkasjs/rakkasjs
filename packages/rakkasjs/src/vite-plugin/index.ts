/// <reference types="@vavite/multibuild/vite-config" />

import { PluginOption } from "vite";
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

export interface RakkasOptions {
	/** File extensions for pages and layouts @default ["jsx","tsx"] */
	pageExtensions?: string[];
	/** Options passed to @vite/plugin-react */
	react?: ReactPluginOptions;
	/**
	 * Paths to start crawling when prerendering static pages.
	 * `true` is the same as `["/"]` a nd `false` is the same as `[]`.
	 * @default false
	 */
	prerender?: string[] | boolean;
}

export default function rakkas(options: RakkasOptions = {}): PluginOption[] {
	let { prerender = [] } = options;
	if (prerender === true) {
		prerender = ["/"];
	} else if (prerender === false) {
		prerender = [];
	}

	return [
		...vaviteConnect({
			handlerEntry: "/virtual:rakkasjs:node-entry",
			clientAssetsDir: "dist/client",
			serveClientAssetsInDev: true,
		}),
		exposeViteDevServer(),

		...react(options.react),

		preventViteBuild(),
		injectConfig({ prerender }),
		apiRoutes(),
		pageRoutes({
			pageExtensions: options.pageExtensions,
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
			entry: "/src/routes/$error",
			virtualName: "error-page",
			defaultContent: DEFAULT_ERROR_PAGE_CONTENTS,
		}),
		resolveClientManifest(),
		...runServerSide(),
	];
}

const DEFAULT_NODE_ENTRY_CONTENTS = `
	import hattipHandler from "virtual:rakkasjs:hattip-entry";
	import { createMiddleware } from "rakkasjs/node-adapter";
	export default createMiddleware(hattipHandler);
`;

const DEFAULT_HATTIP_ENTRY_CONTENTS = `
	import { createRequestHandler } from "rakkasjs";
	export default createRequestHandler();
`;

const DEFAULT_CLIENT_ENTRY_CONTENTS = `
	import { startClient } from "rakkasjs";
	startClient();
`;

const DEFAULT_ERROR_PAGE_CONTENTS = `
	export { DefaultErrorPage as default } from "rakkasjs";
`;
