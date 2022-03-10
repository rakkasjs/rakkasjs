/// <reference types="@vavite/multibuild/vite-config" />

import { PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import { injectConfig } from "./inject-config";
import { preventViteBuild } from "./prevent-vite-build";
import vaviteConnect from "@vavite/connect";
import { apiRoutes } from "./api-routes";
import { pageRoutes } from "./page-routes";
import { clientEntry } from "./client-entry";

export default function rakkas(): PluginOption[] {
	return [
		...vaviteConnect({
			handlerEntry: "rakkasjs/runtime/vavite-handler",
			clientAssetsDir: "dist/client",
			serveClientAssetsInDev: true,
		}),
		...react(),
		preventViteBuild(),
		injectConfig(),
		apiRoutes(),
		pageRoutes(),
		clientEntry(),
	];
}
