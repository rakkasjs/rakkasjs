import reactPlugin from "@vitejs/plugin-react";
import micromatch from "micromatch";
import { PluginOption, normalizePath } from "vite";
import virtual, { updateVirtualModule } from "vite-plugin-virtual";
import { makeRouteManifest } from "./make-route-manifest";
import path from "path";
import { htmlTemplate } from "./html-template";
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

	const pageRoutesContent = await makeRouteManifest({
		srcDir,
		routesDir: pagesDir,
		finalExtensions: componentExtensions,
		wrapperExt: "layout",
		leafExt: "page",
		rootUrl: "/",
	});

	const apiRoutesContent = await makeRouteManifest({
		srcDir,
		routesDir: apiDir,
		finalExtensions: apiExtensions,
		wrapperExt: "middleware",
		leafExt: "endpoint",
		rootUrl: apiRoot + "/",
	});

	const virtualModules = virtual({
		"virtual:rakkasjs:page-imports": `
			const pages = import.meta.glob(${JSON.stringify(PAGES)});
			const layouts = import.meta.glob(${JSON.stringify(LAYOUTS)});
			export default Object.assign(pages, layouts);
		`,

		"virtual:rakkasjs:api-imports": `
			const endpoints = import.meta.glob(${JSON.stringify(ENDPOINTS)});
			const middleware = import.meta.glob(${JSON.stringify(MIDDLEWARE)});
			export default Object.assign(endpoints, middleware);
		`,

		"virtual:rakkasjs:page-routes": pageRoutesContent,
		"virtual:rakkasjs:api-routes": apiRoutesContent,
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
							"virtual:rakkasjs:page-routes",
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
							"virtual:rakkasjs:api-routes",
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
				const i = id.indexOf("virtual:rakkasjs");
				if (i > 0) {
					return this.resolve(id.slice(i), importer, options);
				}

				if (id === "rakkasjs/server") {
					const result = await this.resolve(id, importer, {
						...options,
						skipSelf: true,
					});

					if (result) {
						const qPos = result.id.indexOf("?");
						if (qPos >= 0) {
							result.id = result.id.slice(0, result.id.indexOf("?"));
						}
					}

					return result;
				} else if (id === "virtual:rakkasjs:server") {
					const result = await this.resolve("rakkasjs/server");
					return result;
				} else if (id === "virtual:rakkasjs:placeholder-loader") {
					const result = await this.resolve("rakkasjs/placeholder-loader");
					return result;
				} else if (id === indexHtmlPath) {
					return normalizedIndexHtmlPath;
				} else if (
					id === "virtual:rakkasjs:start-client.js" &&
					importer === normalizedIndexHtmlPath
				) {
					return "virtual:rakkasjs:start-client.js";
				} else if (id === "virtual:rakkasjs:client-hooks") {
					const userVersion = await this.resolve(
						path.resolve(srcDir, "client"),
						importer,
						{
							...options,
							skipSelf: true,
						},
					);
					return userVersion || id;
				} else if (id === "virtual:rakkasjs:server-hooks") {
					const userVersion = await this.resolve(
						path.resolve(srcDir, "server"),
						importer,
						{
							...options,
							skipSelf: true,
						},
					);
					return userVersion || id;
				} else if (id === "virtual:rakkasjs:common-hooks") {
					const userVersion = await this.resolve(
						path.resolve(srcDir, "common"),
						importer,
						{
							...options,
							skipSelf: true,
						},
					);
					return userVersion || id;
				} else if (id === "virtual:rakkasjs:placeholder") {
					const userVersion = await this.resolve(
						path.resolve(srcDir, "placeholder"),
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
					return htmlTemplate;
				} else if (id === "virtual:rakkasjs:start-client.js") {
					return `
					import {startClient} from "rakkasjs/client";
					import routes from "virtual:rakkasjs:page-routes";
					startClient(routes);
				`;
				} else if (
					id === "virtual:rakkasjs:client-hooks" ||
					id === "virtual:rakkasjs:server-hooks" ||
					id === "virtual:rakkasjs:common-hooks"
				) {
					// This bogus export is for silencing the "Generated an empty chunk" warning
					return "export default null";
				} else if (id === "virtual:rakkasjs:placeholder") {
					return `export default () => "Loading..."`;
				}
			},

			async transform(code, id, options) {
				const ssr: boolean | undefined =
					options && (options === true || (options as any).ssr);
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
			babel,
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
