import reactRefresh from "@vitejs/plugin-react-refresh";
import path from "path";
import * as vitePluginVirtual from "vite-plugin-virtual";
import micromatch from "micromatch";
import { InlineConfig, normalizePath } from "vite";
import { FullConfig } from "../..";
import { makeRouteManifest } from "./make-route-manifest";

// vite-plugin-virtual doesn't play nicely with native modules for some reason.
const { default: virtual, updateVirtualModule } = (
	vitePluginVirtual as any as { default: typeof import("vite-plugin-virtual") }
).default;

export async function makeViteConfig(
	config: FullConfig,
	configDeps: string[],
	onConfigChange?: () => void,
): Promise<InlineConfig> {
	const srcDir = normalizePath(path.resolve("src"));
	const publicDir = normalizePath(path.resolve("public"));
	const pagesDir = normalizePath(config.pagesDir);
	const apiDir = normalizePath(config.apiDir);

	const componentExtensions = config.pageExtensions.join("|");
	const PAGES = `/${pagesDir}/**/(*.)?page.(${componentExtensions})`;
	const LAYOUTS = `/${pagesDir}/**/(*/)?layout.(${componentExtensions})`;

	const apiExtensions = config.endpointExtensions.join("|");
	const ENDPOINTS = `/${apiDir}/**/(*.)?endpoint.(${apiExtensions})`;
	const MIDDLEWARE = `/${apiDir}/**/(*/)?middleware.(${apiExtensions})`;

	const isPage = micromatch.matcher(srcDir + PAGES);
	const isLayout = micromatch.matcher(srcDir + LAYOUTS);

	const isEndpoint = micromatch.matcher(srcDir + ENDPOINTS);
	const isMiddleware = micromatch.matcher(srcDir + MIDDLEWARE);

	const virtualModules = virtual({
		"@rakkasjs/page-routes": await makeRouteManifest({
			srcDir,
			routesDir: pagesDir,
			finalExtensions: componentExtensions,
			wrapperExt: "layout",
			leafExt: "page",
			rootUrl: "/",
		}),

		"@rakkasjs/api-routes": await makeRouteManifest({
			srcDir,
			routesDir: apiDir,
			finalExtensions: apiExtensions,
			wrapperExt: "middleware",
			leafExt: "endpoint",
			rootUrl: config.apiRoot + "/",
		}),

		"@rakkasjs/process-request": `
			import apiRoutes from "@rakkasjs/api-routes";
			import pageRoutes from "@rakkasjs/page-routes";

			import {handleRequest} from "rakkasjs/server";

			export function processRequest(req){
				return handleRequest(apiRoutes,pageRoutes,req);
			}`,
	});

	const indexHtmlPath = path.resolve("src", "index.html");
	const normalizedIndexHtmlPath = normalizePath(indexHtmlPath);

	return {
		...config.vite,
		configFile: false,
		root: srcDir,
		publicDir,

		server: {
			...config.vite.server,
			middlewareMode: "ssr",
		},
		optimizeDeps: {
			...config.vite.optimizeDeps,
			exclude: [...(config.vite.optimizeDeps?.exclude || [])],
			include: [
				...(config.vite.optimizeDeps?.include || []),
				"react",
				"react-dom",
				"react-dom/server",
				"react-helmet-async",
			],
		},

		resolve: {
			...config.vite.resolve,
			dedupe: [
				...(config.vite.resolve?.dedupe || []),
				"react",
				"react-dom",
				"react-dom/server",
				"react-helmet-async",
			],
		},
		plugins: [
			reactRefresh(),
			virtualModules,
			{
				name: "rakkas-resolve",
				enforce: "pre",

				configureServer(server) {
					server.watcher.addListener("all", async (e: string, fn: string) => {
						if (
							(isPage(fn) || isLayout(fn)) &&
							(e === "add" || e === "unlink")
						) {
							updateVirtualModule(
								virtualModules,
								"@rakkasjs/page-routes",
								await makeRouteManifest({
									srcDir,
									routesDir: pagesDir,
									finalExtensions: componentExtensions,
									wrapperExt: "layout",
									leafExt: "page",
									rootUrl: "/",
								}),
							);
						} else if (
							(isEndpoint(fn) || isMiddleware(fn)) &&
							(e === "add" || e === "unlink")
						) {
							updateVirtualModule(
								virtualModules,
								"@rakkasjs/api-routes",
								await makeRouteManifest({
									srcDir,
									routesDir: apiDir,
									finalExtensions: apiExtensions,
									wrapperExt: "middleware",
									leafExt: "endpoint",
									rootUrl: config.apiRoot + "/",
								}),
							);
						} else if (configDeps.includes(fn) && onConfigChange) {
							// eslint-disable-next-line no-console
							console.log("Config file dependency", fn, "changed");
							onConfigChange();
						}
					});
				},

				buildStart() {
					this.addWatchFile(srcDir + PAGES);
					this.addWatchFile(srcDir + LAYOUTS);
					this.addWatchFile(srcDir + ENDPOINTS);
					this.addWatchFile(srcDir + MIDDLEWARE);

					if (onConfigChange) {
						configDeps.forEach((dep) => this.addWatchFile(dep));
					}
				},

				async resolveId(id, importer) {
					if (id === indexHtmlPath) {
						return normalizedIndexHtmlPath;
					} else if (
						id === "/__rakkas-start-client.js" &&
						importer === normalizedIndexHtmlPath
					) {
						return id;
					} else if (id === "rakkasjs" || id.startsWith("rakkasjs/")) {
						if (id === "rakkasjs") {
							id += "/index";
						}
						id += ".js";

						const resolved = path.resolve(
							path.resolve(
								"node_modules",
								"rakkasjs",
								"dist",
								id.slice("rakkasjs/".length),
							),
						);

						return resolved;
					}
				},

				async load(id) {
					if (id === normalizedIndexHtmlPath) {
						return template;
					} else if (id === "/__rakkas-start-client.js") {
						return `
							import {startClient} from "rakkasjs/client";
							import routes from "@rakkasjs/page-routes";
							startClient(routes);
						`;
					}
				},
			},

			...(config.vite.plugins || []),
		],
	};
}

const template = `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta http-equiv="X-UA-Compatible" content="ie=edge" />
		<!-- rakkas-head-placeholder -->
	</head>
	<body>
		<div id="rakkas-app"><!-- rakkas-app-placeholder --></div>
		<script type="module" src="/client"></script>
	</body>
</html>`;
