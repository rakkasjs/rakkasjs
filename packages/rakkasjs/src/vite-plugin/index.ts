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
import { virtualNodeHandlerEntry } from "./virtual-node-handler-entry";

export interface RakkasOptions {
	/** File extensions for pages and layouts @default ["jsx","tsx"] */
	pageExtensions?: string[];
	/** Options passed to @vite/plugin-react */
	react?: ReactPluginOptions;

	nodeHandlerEntry?: string;
}

export default function rakkas(options: RakkasOptions = {}): PluginOption[] {
	const nodeHandlerEntry =
		options.nodeHandlerEntry || "/virtual:rakkasjs:node-handler-entry";

	return [
		...vaviteConnect({
			handlerEntry: nodeHandlerEntry,
			clientAssetsDir: "dist/client",
			serveClientAssetsInDev: true,
		}),
		exposeViteDevServer(),

		...react(options.react),

		preventViteBuild(),
		injectConfig(),
		apiRoutes(),
		pageRoutes({
			pageExtensions: options.pageExtensions,
		}),
		virtualNodeHandlerEntry(),
		virtualClientEntry(),
		resolveClientManifest(),
		...runServerSide(),
	];
}
