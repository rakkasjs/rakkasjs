import reactRefresh from "@vitejs/plugin-react-refresh";
import path from "path";
import * as vitePluginVirtual from "vite-plugin-virtual";
import micromatch from "micromatch";
import { InlineConfig, normalizePath } from "vite";
import { FullConfig } from "../..";

// vite-plugin-virtual doesn't play nicely with native modules for some reason.
const { default: virtual, invalidateVirtualModule } = (
	vitePluginVirtual as any as { default: typeof import("vite-plugin-virtual") }
).default;

export function makeViteConfig(
	config: FullConfig,
	configDeps: string[],
	onConfigChange?: () => void,
): InlineConfig {
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

	const indexHtmlPath = path.resolve("src", "index.html");
	const normalizedIndexHtmlPath = normalizePath(indexHtmlPath);

	return {
		...config.vite,
		configFile: false,
		root: srcDir,
		publicDir,
		define: {
			__RAKKAS_CONFIG: {
				pagesDir: config.pagesDir,
				apiDir: config.apiDir,
				apiRoot: config.apiRoot,
			},
		},
		server: {
			...config.vite.server,
			middlewareMode: "ssr",
		},
		optimizeDeps: {
			...config.vite.optimizeDeps,
			exclude: [
				...(config.vite.optimizeDeps?.exclude || []),
				"rakkasjs/server",
				"@rakkasjs/pages-and-layouts",
				"@rakkasjs/endpoints-and-middleware",
			],
			include: [
				...(config.vite.optimizeDeps?.include || []),
				"rakkasjs",
				"rakkasjs/client",
				"rakkasjs/helmet",

				"react",
				"react-dom",
				"react-dom/server",
			],
		},
		resolve: {
			...config.vite.resolve,
			dedupe: [
				...(config.vite.resolve?.dedupe || []),
				"react",
				"react-dom",
				"react-dom/server",
			],
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
					// Avoid infinite loop
					if (importer === "@rakkasjs") return undefined;

					if (id === "/client" && !(await this.resolve(id, "@rakkasjs"))) {
						return id;
					} else if (id === "@rakkasjs/server") {
						const result = (await this.resolve("/server", "@rakkasjs")) || id;
						return result;
					} else if (id === indexHtmlPath) {
						return normalizedIndexHtmlPath;
					}
				},

				async load(id) {
					if (id === "/client") {
						return `import { startClient } from "rakkasjs/client"; startClient();`;
					} else if (id === "@rakkasjs/server") {
						return "";
					} else if (id === normalizedIndexHtmlPath) {
						return template;
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
