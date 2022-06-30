/// <reference types="@vavite/multibuild/vite-config" />

import { PluginOption } from "vite";
import react, { Options as ReactPluginOptions } from "@vitejs/plugin-react";
import { injectConfig } from "./inject-config";
import { preventViteBuild } from "./prevent-vite-build";
import vaviteConnect from "@vavite/connect";
import exposeViteDevServer from "@vavite/expose-vite-dev-server";
import { virtualClientEntry } from "./virtual-client-entry";
import { resolveClientManifest } from "./resolve-client-manifest";

// Feature plugins
import apiRoutes from "../features/api-routes/vite-plugin";
import pageRoutes from "../features/pages/vite-plugin";
import runServerSide from "../features/run-server-side/vite-plugin";
import { virtualHattipEntry } from "./virtual-hattip-entry";
import { virtualNodeEntry } from "./virtual-node-entry";
import { virtualErrorPage } from "./virtual-error-page";

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
		virtualNodeEntry(),
		virtualHattipEntry(),
		virtualClientEntry(),
		virtualErrorPage(),
		resolveClientManifest(),
		...runServerSide(),
	];
}
