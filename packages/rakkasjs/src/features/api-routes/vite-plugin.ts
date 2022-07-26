import { Plugin } from "vite";
import micromatch from "micromatch";
import glob from "fast-glob";
import path from "path";
import { routeToRegExp, sortRoutes } from "../../internal/route-utils";

export default function apiRoutes(): Plugin {
	const extPattern = "mjs|js|ts|jsx|tsx";

	const endpointPattern = `/**/*.api.(${extPattern})`;
	const middlewarePattern = `/**/middleware.(${extPattern})`;

	let root: string;
	let isMiddleware: (filename: string) => boolean;
	let isEndpoint: (filename: string) => boolean;

	async function generateRoutesModule(): Promise<string> {
		const endpointFiles = await glob(root + endpointPattern);

		const middlewareFiles = await (
			await glob(root + middlewarePattern)
		).sort(/* Long to short */ (a, b) => b.length - a.length);

		const middlewareDirs = middlewareFiles.map(
			(f, i) => [i, path.dirname(f)] as const,
		);

		let middlewareImporters = "";

		for (const [i, middlewareFile] of middlewareFiles.entries()) {
			middlewareImporters += `const m${i} = () => import(${JSON.stringify(
				middlewareFile,
			)});\n`;
		}

		let endpointImporters = "";

		for (const [i, endpointFile] of endpointFiles.entries()) {
			endpointImporters += `const e${i} = () => import(${JSON.stringify(
				endpointFile,
			)});\n`;
		}

		let exportStatement = "export default [\n";

		const endpointRoutes = sortRoutes(
			endpointFiles.map((endpointFile, i) => {
				const relName = path.relative(root, endpointFile);
				const baseName = /^(.*)\.api\.(.*)$/.exec(relName)![1];
				return [baseName, i, endpointFile] as [string, number, string];
			}),
		);

		for (const [baseName, i, endpointFile] of endpointRoutes) {
			const middlewares = middlewareDirs
				.filter(([, dirName]) => endpointFile.startsWith(dirName + "/"))
				.map(([mi]) => mi);

			const [re, rest] = routeToRegExp("/" + baseName);
			exportStatement += `  [${re}, [e${i}, ${middlewares.map(
				(mi) => `m${mi}`,
			)}]${rest ? `, ${JSON.stringify(rest)}` : ""}],\n`;
		}

		exportStatement += "]";

		const out = [middlewareImporters, endpointImporters, exportStatement]
			.filter(Boolean)
			.join("\n");

		return out;
	}

	return {
		name: "rakkasjs:endpoint-router",

		resolveId(id) {
			if (id === "virtual:rakkasjs:api-routes") {
				return id;
			}
		},

		async load(id) {
			if (id === "virtual:rakkasjs:api-routes") {
				return generateRoutesModule();
			}
		},

		configResolved(config) {
			root = config.root + "/src/routes";
			isMiddleware = micromatch.matcher(endpointPattern);
			isEndpoint = micromatch.matcher(middlewarePattern);
		},

		configureServer(server) {
			server.watcher.addListener("all", async (e: string, fn: string) => {
				if (
					(isEndpoint(fn) || isMiddleware(fn)) &&
					(e === "add" || e === "unlink")
				) {
					const module = server.moduleGraph.getModuleById(
						"virtual:rakkasjs:api-routes",
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
