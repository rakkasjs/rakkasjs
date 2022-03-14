import { Plugin, ResolvedConfig } from "vite";
import micromatch from "micromatch";
import glob from "fast-glob";
import path from "path";
import { routeToRegExp, sortRoutes } from "./util/route-utils";
import fs from "fs";

export interface PageRoutesOptions {
	pageExtensions?: string[];
}

export function pageRoutes(options: PageRoutesOptions = {}): Plugin {
	const { pageExtensions = ["tsx", "jsx"] } = options;

	const extPattern = pageExtensions.join("|");

	const pagePattern = `/**/*.page.(${extPattern})`;
	const layoutPattern = `/**/layout.(${extPattern})`;

	let resolvedConfig: ResolvedConfig;
	let routesRoot: string;
	let isLayout: (filename: string) => boolean;
	let isPage: (filename: string) => boolean;

	async function generateRoutesModule(
		client?: boolean,
		importer?: boolean,
	): Promise<string> {
		const pageFiles = await glob(routesRoot + pagePattern);

		const layoutFiles = await (
			await glob(routesRoot + layoutPattern)
		).sort((a, b) => /* Long to short */ b.length - a.length);

		const layoutDirs = layoutFiles.map((f) => path.dirname(f));

		let layoutImporters = "";

		for (const [i, layoutFile] of layoutFiles.entries()) {
			const relName = path.relative(resolvedConfig.root, layoutFile);
			const importer = `() => import(${JSON.stringify(layoutFile)})`;

			layoutImporters +=
				`const m${i} = ` +
				(client
					? importer
					: `[${JSON.stringify(relName.replace(/\\/g, "/"))}, ${importer}]`) +
				";\n";
		}

		let pageImporters = "";

		for (const [i, pageFile] of pageFiles.entries()) {
			const relName = path.relative(resolvedConfig.root, pageFile);
			const importer = `() => import(${JSON.stringify(pageFile)})`;

			pageImporters +=
				`const e${i} = ` +
				(client
					? importer
					: `[${JSON.stringify(relName.replace(/\\/g, "/"))}, ${importer}]`) +
				";\n";
		}

		let exportStatement = importer
			? "globalThis.dummy = [\n"
			: "export default [\n";

		const pageRoutes = sortRoutes(
			pageFiles.map((pageFile, i) => {
				const relName = path.relative(routesRoot, pageFile);
				const baseName = /^(.*)\.page\.(.*)$/.exec(relName)![1];
				return [baseName, i, pageFile] as [string, number, string];
			}),
		);

		for (const [baseName, i, pageFile] of pageRoutes) {
			const layouts = layoutDirs
				.filter((dirName) => pageFile.startsWith(dirName + "/"))
				.map((_, mi) => mi);

			exportStatement += `  [${routeToRegExp(
				"/" + baseName,
			)}, [e${i}, ${layouts.map((mi) => `m${mi}`)}]],\n`;
		}

		exportStatement += "]";

		const out = [layoutImporters, pageImporters, exportStatement]
			.filter(Boolean)
			.join("\n");

		return out;
	}

	return {
		name: "rakkasjs:page-router",

		resolveId(id) {
			if (
				id === "virtual:rakkasjs:server-page-routes" ||
				id === "virtual:rakkasjs:client-page-routes" ||
				id === "virtual:rakkasjs:client-pages-importer"
			) {
				return id;
			}
		},

		async load(id) {
			if (id === "virtual:rakkasjs:server-page-routes") {
				return generateRoutesModule();
			} else if (id === "virtual:rakkasjs:client-page-routes") {
				return generateRoutesModule(true);
			} else if (id === "virtual:rakkasjs:client-pages-importer") {
				return generateRoutesModule(true, true);
			}
		},

		config(config, env) {
			if (env.command === "build" && !config.build?.ssr) {
				return {
					build: {
						rollupOptions: {
							input: {
								// This dummy entry makes sure that all pages and layouts are pulled into the build.
								// It's deleted on closeBundle since it's not needed at runtime.
								rakkasPages: "virtual:rakkasjs:client-pages-importer",
							},
						},
					},
				};
			}
		},

		configResolved(config) {
			resolvedConfig = config;
			routesRoot = config.root + "/src/routes";
			isLayout = micromatch.matcher(pagePattern);
			isPage = micromatch.matcher(layoutPattern);
		},

		configureServer(server) {
			server.watcher.addListener("all", async (e: string, fn: string) => {
				if ((isPage(fn) || isLayout(fn)) && (e === "add" || e === "unlink")) {
					const module = server.moduleGraph.getModuleById(
						"virtual:rakkasjs:server-page-routes",
					);

					if (module) {
						server.moduleGraph.invalidateModule(module);
						if (server.ws) {
							server.ws.send({
								type: "full-reload",
								path: "*",
							});
						}
					}
				}
			});
		},

		async closeBundle() {
			if (!(resolvedConfig.build.rollupOptions.input as any)?.rakkasPages) {
				return;
			}

			const manifest = JSON.parse(
				await fs.promises.readFile(
					path.resolve(resolvedConfig.root, "dist/manifest.json"),
					"utf-8",
				),
			);

			const importerPath =
				manifest!["virtual:rakkasjs:client-pages-importer"]?.file;

			if (importerPath) {
				fs.promises.rm(
					path.resolve(resolvedConfig.root, "dist/client", importerPath),
				);
			}
		},
	};
}
