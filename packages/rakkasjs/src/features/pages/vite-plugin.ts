import { Plugin, ResolvedConfig } from "vite";
import micromatch from "micromatch";
import glob from "fast-glob";
import path from "path";
import { routeToRegExp, sortRoutes } from "../../internal/route-utils";

export interface PageRoutesOptions {
	pageExtensions?: string[];
}

export default function pageRoutes(options: PageRoutesOptions = {}): Plugin[] {
	const { pageExtensions = ["tsx", "jsx"] } = options;

	const extPattern = pageExtensions.join("|");

	const pagePattern = `/**/*.page.(${extPattern})`;
	const layoutPattern = `/**/layout.(${extPattern})`;

	const jsPattern = "mjs|js|ts|jsx|tsx";
	const guardPattern = `/**/$guard.(${jsPattern})`;
	const singlePageGuardPattern = `/**/*.guard.(${jsPattern})`;

	let resolvedConfig: ResolvedConfig;
	let routesRoot: string;
	let isLayout: (filename: string) => boolean;
	let isPage: (filename: string) => boolean;
	let isGuard: (filename: string) => boolean;
	let isSinglePageGuard: (filename: string) => boolean;

	async function generateRoutesModule(client?: boolean): Promise<string> {
		const pageFiles = (await glob(routesRoot + pagePattern)).map((f) =>
			path.relative(resolvedConfig.root, f).replace(/\\/g, "/"),
		);

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

		const guardFiles = (await glob(routesRoot + guardPattern))
			.sort(/* short to kong  */ (a, b) => a.length - b.length)
			.map((f) => path.relative(resolvedConfig.root, f).replace(/\\/g, "/"));

		const guardDirs = guardFiles.map((f) => path.dirname(f));

		let guardImporters = "";

		for (const [i, guardFile] of guardFiles.entries()) {
			guardImporters += `import { pageGuard as g${i} } from ${JSON.stringify(
				"/" + guardFile,
			)};\n`;
		}

		const singlePageGuardFiles = (
			await glob(routesRoot + singlePageGuardPattern)
		).map((f) => path.relative(resolvedConfig.root, f).replace(/\\/g, "/"));

		let singlePageGuardImporters = "";

		const guardedPageIndices = new Set<number>();
		for (const [, singlePageGuardFile] of singlePageGuardFiles.entries()) {
			const baseName = /^(.*)guard\.(.*)$/.exec(singlePageGuardFile)![1];
			const pageIndex = pageFiles.findIndex((f) => f.startsWith(baseName));
			if (pageIndex < 0) continue;

			singlePageGuardImporters += `import { pageGuard as s${pageIndex} } from ${JSON.stringify(
				"/" + singlePageGuardFile,
			)};\n`;
			guardedPageIndices.add(pageIndex);
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

			const guards = Array.from(guardDirs.entries())
				.filter((entry) => pageFile.startsWith(entry[1] + "/"))
				.map((entry) => entry[0]);

			const [re, rest] = routeToRegExp("/" + baseName);
			let exportElement = `  [${re}, [p${i}, ${layouts.map(
				(li) => `l${li}`,
			)}], [${guards.map((gi) => `g${gi}`)}`;

			if (guardedPageIndices.has(i)) {
				exportElement += `, s${i}`;
			}

			exportElement += "]";

			if (rest) {
				exportElement += `, ${JSON.stringify(rest)}`;
			} else {
				exportElement += `, `;
			}

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
			guardImporters,
			singlePageGuardImporters,
			pageNames,
			exportStatement,
		]
			.filter(Boolean)
			.join("\n");

		return out;
	}

	return [
		{
			name: "rakkasjs:page-router",

			resolveId(id) {
				if (id === "virtual:rakkasjs:server-page-routes") {
					return id;
				} else if (id.includes("virtual:rakkasjs:client-page-routes")) {
					return "virtual:rakkasjs:client-page-routes";
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
				isGuard = micromatch.matcher(guardPattern);
				isSinglePageGuard = micromatch.matcher(singlePageGuardPattern);

				// This is ugly but it's the easiest way to pass some info
				// to the Babel transform
				(config as any).api.rakkas.isPage = isPage;
				(config as any).api.rakkas.isLayout = isLayout;
			},

			configureServer(server) {
				server.watcher.addListener("all", async (e: string, fn: string) => {
					const isGuardFile = isGuard(fn) || isSinglePageGuard(fn);

					if (
						((isPage(fn) || isLayout(fn) || isGuardFile) &&
							(e === "add" || e === "unlink")) ||
						(isGuardFile && e === "change")
					) {
						const serverModule = server.moduleGraph.getModuleById(
							"virtual:rakkasjs:server-page-routes",
						);
						const clientModule = server.moduleGraph.getModuleById(
							"virtual:rakkasjs:client-page-routes",
						);

						if (serverModule) {
							server.moduleGraph.invalidateModule(serverModule);
						}

						if (clientModule) {
							server.moduleGraph.invalidateModule(clientModule);
						}

						if (server.ws && (serverModule || clientModule)) {
							server.ws.send({
								type: "full-reload",
								path: "*",
							});
						}
					}
				});
			},

			transform(code, id, options) {
				if (options?.ssr) return;

				if (isPage(id) || isLayout(id)) {
					return code + PAGE_HOT_RELOAD;
				}
			},
		},
	];
}

const PAGE_HOT_RELOAD = `
	if (import.meta.hot) {
		import.meta.hot.accept(() => {
			$RAKKAS_UPDATE();
		});
	}
`;
