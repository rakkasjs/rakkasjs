import { Plugin, ResolvedConfig } from "vite";
import micromatch from "micromatch";
import glob from "fast-glob";
import path from "path";
import { routeToRegExp, sortRoutes } from "./util/route-utils";

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

	async function generateRoutesModule(client?: boolean): Promise<string> {
		const pageFiles = (await glob(routesRoot + pagePattern)).map((f) =>
			path.relative(resolvedConfig.root, f).replace(/\\/g, "/"),
		);

		const layoutFiles = (await glob(routesRoot + layoutPattern))
			.sort(/* Long to short */ (a, b) => b.length - a.length)
			.map((f) => path.relative(resolvedConfig.root, f).replace(/\\/g, "/"));

		const layoutDirs = layoutFiles.map((f) => path.dirname(f));

		let layoutImporters = "";

		for (const [i, layoutFile] of layoutFiles.entries()) {
			layoutImporters += `const l${i} = () => import(${JSON.stringify(
				"/" + layoutFile,
			)});\n`;
		}

		let layoutNames = "";
		if (!client) {
			for (const [i, layoutFile] of layoutFiles.entries()) {
				layoutNames += `const m${i} = ${JSON.stringify(layoutFile)};\n`;
			}
		}

		let pageImporters = "";

		for (const [i, pageFile] of pageFiles.entries()) {
			pageImporters += `const p${i} = () => import(${JSON.stringify(
				"/" + pageFile,
			)});\n`;
		}

		let pageNames = "";
		if (!client) {
			for (const [i, pageFile] of pageFiles.entries()) {
				pageNames += `const r${i} = ${JSON.stringify(pageFile)};\n`;
			}
		}

		let exportStatement = "export default [\n";

		const pageRoutes = sortRoutes(
			pageFiles.map((endpointFile, i) => {
				const relName = path
					.relative(routesRoot, endpointFile)
					.replace(/\\/g, "/");
				const baseName = /^(.*)\.page\.(.*)$/.exec(relName)![1];
				return [baseName, i, endpointFile] as [string, number, string];
			}),
		);

		for (const [baseName, i, pageFile] of pageRoutes) {
			const layouts = Array.from(layoutDirs.entries())
				.filter((entry) => pageFile.startsWith(entry[1] + "/"))
				.map((entry) => entry[0]);

			let exportElement = `  [${routeToRegExp(
				"/" + baseName,
			)}, [p${i}, ${layouts.map((li) => `l${li}`)}]`;

			// Server needs the file names to inject styles and prefetch links
			if (!client) {
				exportElement += `, [r${i}, ${layouts.map((li) => `m${li}`)}]`;
			}

			exportElement += "],\n";

			exportStatement += exportElement;
		}

		exportStatement += "]";

		const out = [
			layoutImporters,
			layoutNames,
			pageImporters,
			pageNames,
			exportStatement,
		]
			.filter(Boolean)
			.join("\n");

		return out;
	}

	return {
		name: "rakkasjs:page-router",

		resolveId(id) {
			if (
				id === "virtual:rakkasjs:server-page-routes" ||
				id === "virtual:rakkasjs:client-page-routes"
			) {
				return id;
			}
		},

		async load(id) {
			if (id === "virtual:rakkasjs:server-page-routes") {
				return generateRoutesModule();
			} else if (id === "virtual:rakkasjs:client-page-routes") {
				return generateRoutesModule(true);
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
	};
}
