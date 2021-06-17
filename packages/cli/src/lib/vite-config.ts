import reactRefresh from "@vitejs/plugin-react-refresh";
import path from "path";
import virtual, { invalidateVirtualModule } from "vite-plugin-virtual";
import picomatch from "picomatch";
import type { InlineConfig } from "vite";
import { FullConfig } from "../..";

const PAGES = "/pages/**/(*.)?page.[[:alnum:]]+";
const LAYOUTS = "/pages/**/(*/)?layout.[[:alnum:]]+";

const ENDPOINTS = "/pages/**/(*.)?endpoint.[[:alnum:]]+";
const MIDDLEWARE = "/pages/**/(*/)?middleware.[[:alnum:]]+";

export function makeViteConfig(
	config: FullConfig,
	configDeps: string[],
	onConfigChange?: () => void,
): InlineConfig {
	const srcDir = path.resolve("src");

	const isPage = picomatch(path.join(srcDir, PAGES));
	const isLayout = picomatch(path.join(srcDir, LAYOUTS));

	const isEndpoint = picomatch(path.join(srcDir, ENDPOINTS));
	const isMiddleware = picomatch(path.join(srcDir, MIDDLEWARE));

	const pagesAndLayouts =
		`export const pages = import.meta.glob(${JSON.stringify(PAGES)});` +
		`export const layouts = import.meta.glob(${JSON.stringify(LAYOUTS)});`;

	const endpointsAndMiddleware =
		`export const endpoints = import.meta.glob(${JSON.stringify(ENDPOINTS)});` +
		`export const middleware = import.meta.glob(${JSON.stringify(
			MIDDLEWARE,
		)});`;

	const virtualModules = virtual({
		"@rakkasjs/pages-and-layouts": pagesAndLayouts,
		"@rakkasjs/endpoints-and-middleware": endpointsAndMiddleware,
	});

	return {
		...config.vite,
		configFile: false,
		root: srcDir,
		server: {
			...config.vite.server,
			middlewareMode: "ssr",
		},
		plugins: [
			reactRefresh(),
			virtualModules,
			{
				name: "rakkas-resolve",
				enforce: "pre",

				configureServer(server) {
					server.watcher.addListener("all", (e: string, fn: string) => {
						if (
							(isPage(fn) || isLayout(fn)) &&
							(e === "add" || e === "unlink")
						) {
							invalidateVirtualModule(server, "@rakkasjs/pages-and-layouts");
						} else if (
							(isEndpoint(fn) || isMiddleware(fn)) &&
							(e === "add" || e === "unlink")
						) {
							invalidateVirtualModule(
								server,
								"@rakkasjs/endpoints-and-middleware",
							);
						} else if (configDeps.includes(fn) && onConfigChange) {
							console.log("Config file dependency", fn, "changed");
							onConfigChange();
						}
					});
				},

				buildStart() {
					this.addWatchFile(path.join(srcDir, PAGES));
					this.addWatchFile(path.join(srcDir, LAYOUTS));
					this.addWatchFile(path.join(srcDir, ENDPOINTS));
					this.addWatchFile(path.join(srcDir, MIDDLEWARE));

					if (onConfigChange) {
						configDeps.forEach((dep) => this.addWatchFile(dep));
					}
				},

				async resolveId(id, importer) {
					// Avoid infinite loop
					if (importer === "@rakkasjs") return undefined;

					if (id === "/client" && !(await this.resolve(id, "@rakkasjs"))) {
						return id;
					}
				},

				async load(id) {
					if (id === "/client") {
						return {
							code: `import { startClient } from "@rakkasjs/core/client"; startClient();`,
						};
					}
				},
			},
			...(config.vite.plugins || []),
		],
		resolve: {
			...config.vite.resolve,
			alias: {
				"$app": srcDir,
				...config.vite.resolve?.alias,
			},
		},
	};
}
