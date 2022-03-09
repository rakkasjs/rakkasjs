/// <reference types="@vavite/multibuild/vite-config" />

import { PluginOption } from "vite";
import { injectConfig } from "./inject-config";
import { preventViteBuild } from "./prevent-vite-build";
import vaviteConnect from "@vavite/connect";
import { apiRoutes } from "./api-routes";

export default function rakkas(): PluginOption[] {
	return [
		...vaviteConnect({
			handlerEntry: "rakkasjs/entries/vavite-handler",
			clientAssetsDir: "dist/client",
			serveClientAssetsInDev: true,
		}),
		preventViteBuild(),
		injectConfig(),
		apiRoutes(),
	];
}
