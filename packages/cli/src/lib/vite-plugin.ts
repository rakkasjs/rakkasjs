import reactPlugin from "@vitejs/plugin-react";
import micromatch from "micromatch";
import { PluginOption, normalizePath } from "vite";
import virtual, { updateVirtualModule } from "vite-plugin-virtual";
import { makeRouteManifest } from "./make-route-manifest";
import path from "path";
import { htmlTemplate } from "./html-template";
import { babelPluginStripLoadFunction } from "./babelPluginStripLoadFunction";
import chalk from "chalk";
import { TransformOptions } from "@babel/core";

export interface RakkasVitePluginConfig {
	srcDir: string;
	pagesDir: string;
	apiDir: string;
	pageExtensions: string[];
	endpointExtensions: string[];
	apiRoot: string;
	configDeps?: string[];
	stripLoadFunctions?: boolean;
	babel?: TransformOptions;
	onConfigChange?: () => void;
}

export async function rakkasVitePlugin(
	config: RakkasVitePluginConfig,
): Promise<PluginOption[]> {
	const {
		srcDir,
		pagesDir,
		apiDir,
		pageExtensions,
		endpointExtensions,
		apiRoot,
		configDeps,
		stripLoadFunctions = false,
		babel = {},
		onConfigChange,
	} = config;

	const componentExtensions = pageExtensions.join("|");
	const PAGES = `/${pagesDir}/**/(*.)?page.(${componentExtensions})`;
	const LAYOUTS = `/${pagesDir}/**/(*/)?layout.(${componentExtensions})`;

	const apiExtensions = endpointExtensions.join("|");
	const ENDPOINTS = `/${apiDir}/**/(*.)?endpoint.(${apiExtensions})`;
	const MIDDLEWARE = `/${apiDir}/**/(*/)?middleware.(${apiExtensions})`;

	const isPage = micromatch.matcher(srcDir + PAGES);
	const isLayout = micromatch.matcher(srcDir + LAYOUTS);

	const isEndpoint = micromatch.matcher(srcDir + ENDPOINTS);
	const isMiddleware = micromatch.matcher(srcDir + MIDDLEWARE);

	const indexHtmlPath = path.resolve("src", "index.html");
	const normalizedIndexHtmlPath = normalizePath(indexHtmlPath);

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
			rootUrl: apiRoot + "/",
		}),

		"@rakkasjs/process-request": `
			import apiRoutes from "@rakkasjs/api-routes";
			import pageRoutes from "@rakkasjs/page-routes";

			import {handleRequest} from "rakkasjs/server";

			export function processRequest(req){
				return handleRequest(apiRoutes,pageRoutes,req);
			}`,
	});

	let ssr: boolean;
	let command: "build" | "serve";

	return [
		virtualModules,
		{
			name: "rakkas",
			enforce: "pre",

			configResolved(config) {
				ssr = !!config.build.ssr;
				command = config.command;
			},

			configureServer(server) {
				server.watcher.addListener("all", async (e: string, fn: string) => {
					if ((isPage(fn) || isLayout(fn)) && (e === "add" || e === "unlink")) {
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
					} else if (configDeps && configDeps.includes(fn) && onConfigChange) {
						// eslint-disable-next-line no-console
						console.log("Config file dependency", chalk.blue(fn), "changed");
						onConfigChange();
					}
				});
			},

			buildStart() {
				if (command === "build") return;

				this.addWatchFile(srcDir + PAGES);
				this.addWatchFile(srcDir + LAYOUTS);
				this.addWatchFile(srcDir + ENDPOINTS);
				this.addWatchFile(srcDir + MIDDLEWARE);

				if (onConfigChange && configDeps) {
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
					// } else if (id === "@rakkasjs/common-hooks") {
					// 	const userVersion = await this.resolve(
					// 		path.resolve(srcDir, "common"),
					// 		importer,
					// 		{
					// 			...options,
					// 			skipSelf: true,
					// 		},
					// 	);
					// 	return userVersion || id;
				}
			},

			async load(id) {
				if (id === normalizedIndexHtmlPath) {
					return htmlTemplate;
				} else if (id === "/__rakkas-start-client.js") {
					return `
					import {startClient} from "rakkasjs/client";
					import routes from "@rakkasjs/page-routes";
					startClient(routes);
				`;
				} else if (
					id === "@rakkasjs/client-hooks" ||
					id === "@rakkasjs/server-hooks"
					// || id === "@rakkasjs/common-hooks"
				) {
					// This bogus export is for silencing the "Generated an empty chunk" warning
					return "export const nothing = 1";
				}
			},

			async transform(code, id, ssr?: boolean) {
				if (ssr || command === "build") return;

				if (isPage(id) || isLayout(id)) {
					const idstr = JSON.stringify(id.slice(srcDir.length));
					// return refreshHeader(idstr) + code + refreshFooter(idstr);
					return code + refreshFooter(idstr);
				}

				return code;
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

					pageDeps[normalizePath(path.relative(srcDir, id))] = [...depSet].map(
						(x) => normalizePath(path.relative(srcDir, x)),
					);
				}

				await this.emitFile({
					type: "asset",
					fileName: "import-manifest.json",
					source: JSON.stringify(pageDeps),
				});
			},
		},

		...reactPlugin({
			exclude: [PAGES.slice(1), LAYOUTS.slice(1)],
			babel: stripLoadFunctions
				? {
						...babel,
						plugins: [...(babel.plugins || []), babelPluginStripLoadFunction()],
				  }
				: babel,
		}),
	];
}

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
	}
`;
