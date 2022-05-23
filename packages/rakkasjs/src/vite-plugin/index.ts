/// <reference types="@vavite/multibuild/vite-config" />

import { PluginOption } from "vite";
import react, { Options as ReactPluginOptions } from "@vitejs/plugin-react";
import { injectConfig } from "./inject-config";
import { preventViteBuild } from "./prevent-vite-build";
import vaviteConnect from "@vavite/connect";
import exposeViteDevServer from "@vavite/expose-vite-dev-server";
import { apiRoutes } from "./api-routes";
import { pageRoutes } from "./page-routes";
import { virtualClientEntry } from "./virtual-client-entry";
import { resolveClientManifest } from "./resolve-client-manifest";
import runServerSide from "./run-server-side/run-server-side";

export interface RakkasOptions {
	/** File extensions for pages and layouts @default ["jsx","tsx"] */
	pageExtensions?: string[];
	/** Options passed to @vite/plugin-react */
	react?: ReactPluginOptions;
}

export default function rakkas(options: RakkasOptions = {}): PluginOption[] {
	return [
		...vaviteConnect({
			handlerEntry: "rakkasjs/runtime/vavite-handler",
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
		virtualClientEntry(),
		resolveClientManifest(),
		...runServerSide(),
	];
}
