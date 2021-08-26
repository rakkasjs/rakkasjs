import reactRefresh from "@vitejs/plugin-react-refresh";
import path from "path";
import virtual, { updateVirtualModule } from "vite-plugin-virtual";
import micromatch from "micromatch";
import { InlineConfig, normalizePath, SSROptions } from "vite";
import { FullConfig } from "../..";
import { makeRouteManifest } from "./make-route-manifest";

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

		"@rakkasjs/page-imports": `
			const pages = import.meta.glob(${JSON.stringify(PAGES)});
			const layouts = import.meta.glob(${JSON.stringify(LAYOUTS)});
			export default Object.assign(pages, layouts);
		`,

		"@rakkasjs/api-imports": `
			const endpoints = import.meta.glob(${JSON.stringify(ENDPOINTS)});
			const middleware = import.meta.glob(${JSON.stringify(MIDDLEWARE)});
			export default Object.assign(endpoints, middleware);
		`,

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

	let ssr: boolean;
	let mode: string;

	const result: InlineConfig = {
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
			exclude: [
				...(config.vite.optimizeDeps?.exclude || [
					"rakkasjs",
					"rakkasjs/server",
				]),
			],
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
			...(config.vite.plugins || []),
			virtualModules,
			{
				name: "rakkas-resolve",
				enforce: "pre",

				configResolved(config) {
					ssr = !!config?.build?.ssr;
					mode = config.mode;
				},

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

				async resolveId(id, importer, options) {
					if (id === indexHtmlPath) {
						return normalizedIndexHtmlPath;
					} else if (
						id === "/__rakkas-start-client.js" &&
						importer === normalizedIndexHtmlPath
					) {
						return id;
					} else if (id === "@rakkasjs/client-hooks") {
						const userVersion = await this.resolve(
							path.resolve(srcDir, "client"),
							importer,
							{
								...options,
								skipSelf: true,
							},
						);
						return userVersion || id;
					} else if (id === "@rakkasjs/server-hooks") {
						const userVersion = await this.resolve(
							path.resolve(srcDir, "server"),
							importer,
							{
								...options,
								skipSelf: true,
							},
						);
						return userVersion || id;
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
					} else if (
						id === "@rakkasjs/client-hooks" ||
						id === "@rakkasjs/server-hooks"
					) {
						return "";
					}
				},

				async generateBundle() {
					if (ssr) return;

					// TODO: This is pretty stupid, we should just pass the import manifest to the caller using some other technique

					const modules: Record<string, string[]> = {};
					for (const id of this.getModuleIds()) {
						const module = this.getModuleInfo(id);
						if (!module) continue;

						for (const importer of module.importers) {
							modules[importer] = modules[importer] || [];
							modules[importer].push(id);
						}
					}

					const pageDeps: Record<string, string[]> = {};
					for (const [id, deps] of Object.entries(modules)) {
						if (!isPage(id) && !isLayout(id)) continue;

						const depSet = new Set<string>();

						// eslint-disable-next-line no-inner-declarations
						function addDeps(deps: string[]) {
							if (!deps.length) return;

							const newDeps = new Set<string>();

							for (const dep of deps) {
								const imports = modules[dep];
								if (!imports) continue;

								imports.forEach((x) => {
									if (!depSet.has(x)) {
										depSet.add(x);
										newDeps.add(x);
									}
								});
							}

							addDeps([...newDeps]);
						}

						const initialDeps = deps.map((x) => x);

						addDeps(initialDeps);

						pageDeps[normalizePath(path.relative(srcDir, id))] = [
							...depSet,
						].map((x) => normalizePath(path.relative(srcDir, x)));
					}

					await this.emitFile({
						type: "asset",
						fileName: "import-manifest.json",
						source: JSON.stringify(pageDeps),
					});
				},
			},
			{
				name: "rakkas-refresh-page",
				enforce: "pre",
				async transform(code, id, ssr) {
					if (ssr || mode === "production") return;

					if (isPage(id) || isLayout(id)) {
						const idstr = JSON.stringify(id.slice(srcDir.length));
						// return refreshHeader(idstr) + code + refreshFooter(idstr);
						return code + refreshFooter(idstr);
					}

					return code;
				},
			},
			reactRefresh({ exclude: [PAGES, LAYOUTS] }),
		],
	};

	const ssrOptions: SSROptions = {
		noExternal: ["rakkasjs", "rakkasjs/server"],
	};

	// @ts-expect-error: SSR options are not in the type definitions yet
	result.ssr = ssrOptions;

	return result;
}

const template = `<!DOCTYPE html>
<html><!-- rakkas-html-attributes-placeholder -->
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta http-equiv="X-UA-Compatible" content="ie=edge" />
		<!-- rakkas-head-placeholder -->
	</head>
	<body><!-- rakkas-body-attributes-placeholder -->
		<div id="rakkas-app"><!-- rakkas-app-placeholder --></div>
		<script type="module" src="/__rakkas-start-client.js"></script>
	</body>
</html>`;

const refreshFooter = (id: string) => `// $RefreshReg$()
	if (import.meta.hot) {
		import.meta.hot.accept((m) => {
			function reload() {
				if (window.__vite_plugin_react_timeout) {
					requestAnimationFrame(reload);
				} else {
					window.$rakkas$reloader[${id}] && window.$rakkas$reloader[${id}](m);
				}
			}
			console.log("Reloading", ${id});
			reload();
		});

		// window.$RefreshReg$ = prevRefreshReg;
		// window.$RefreshSig$ = prevRefreshSig;
		// console.log("Uninstalled", import.meta.url, prevRefreshSig);
		// import.meta.hot.accept();
		// if (!window.__vite_plugin_react_timeout) {
		// 	window.__vite_plugin_react_timeout = setTimeout(() => {
		// 		window.__vite_plugin_react_timeout = 0;
		// 		RefreshRuntime.performReactRefresh();
		// 	}, 30);
		// }
	}
`;
