/// <reference types="@vavite/multibuild/vite-config" />
// import micromatch from "micromatch";
import { PluginOption, ResolvedConfig } from "vite";
import glob from "fast-glob";
import path from "path";
import { routeToRegExp, sortRoutes } from "./route-utils";

// export interface RakkasCoreOptions {}

export default function rakkasCore(): PluginOption[] {
	// options: RakkasCoreOptions = {},
	let config: ResolvedConfig;

	// let isRoute: (filename: string) => boolean;
	// let isWrapper: (filename: string) => boolean;

	async function generateRoutesModule(client: boolean) {
		if (client) {
			throw new Error("Client-side routing is not yet implemented");
		}

		const cwd = path.join(config.root, ROUTES_DIR);

		function getPath(filename: string) {
			const dir = path.dirname(filename).replace(/\\/g, "/");
			return dir === "." ? "" : dir;
		}

		let wrapperIndex = 1;
		let wrapperImporters = "";

		const wrappers = (await glob(WRAPPER_PATTERN, { cwd }))
			.map((filename) => {
				const importSpecifier =
					"/" + path.join(ROUTES_DIR, filename).replace(/\\/g, "/");
				const name = `w${wrapperIndex++}`;

				wrapperImporters += `const ${name} = () => import(${JSON.stringify(
					importSpecifier,
				)});\n`;

				return {
					name,
					importSpecifier,
					path: getPath(filename),
				};
			})
			.sort((a, b) => a.path.length - b.path.length);

		let routeIndex = 1;
		let routeImporters = "";

		const routes = sortRoutes(
			(await glob(ROUTE_PATTERN, { cwd })).map((filename) => {
				const dir = filename.match(/^(.*)\.(?:page|api)\./)![1];
				const importSpecifier =
					"/" + path.join(ROUTES_DIR, filename).replace(/\\/g, "/");
				const name = `r${routeIndex++}`;
				routeImporters += `const ${name} = () => import(${JSON.stringify(
					importSpecifier,
				)});\n`;

				return {
					name,
					importSpecifier,
					path: dir,
					regex: routeToRegExp(dir ? "/" + dir : dir)[0],
					parents: wrappers.filter((w) => dir.startsWith(w.path)),
				};
			}),
		);

		let routeExports = "export default [\n";

		for (const route of routes) {
			routeExports += `  [${route.regex}, ${route.name}, [${[...route.parents]
				.map((r) => r.name)
				.join(", ")}]],\n`;
		}

		routeExports += "];\n";

		const output = [wrapperImporters, routeImporters, routeExports]
			.filter(Boolean)
			.join("\n");

		return output;
	}

	return [
		{
			name: "rakkas:router",

			configResolved(cfg) {
				config = cfg;
				// isRoute = micromatch.matcher(ROUTE_PATTERN);
				// isWrapper = micromatch.matcher(WRAPPER_PATTERN);
			},

			resolveId(id) {
				if (id === SERVER_ROUTES_ID) {
					return VIRTUAL_SERVER_ROUTES_ID;
				} else if (id === CLIENT_ROUTES_ID) {
					return VIRTUAL_CLIENT_ROUTES_ID;
				}
			},

			async load(id) {
				if (id === VIRTUAL_SERVER_ROUTES_ID) {
					return generateRoutesModule(false);
				} else if (id === VIRTUAL_CLIENT_ROUTES_ID) {
					return generateRoutesModule(true);
				}
			},
		},
	];
}

const ROUTES_DIR = "src/routes";

const ROUTE_PATTERN = `**/*.(page|api).*`;
const WRAPPER_PATTERN = `**/(*.|)(layout|middleware).*`;

const MODULE_PREFIX = "rakkasjs:";
const VIRTUAL_PREFIX = "\0virtual:";
const SERVER_ROUTES_ID = `${MODULE_PREFIX}server-routes`;
const CLIENT_ROUTES_ID = `${MODULE_PREFIX}client-routes`;
const VIRTUAL_SERVER_ROUTES_ID = `${VIRTUAL_PREFIX}${SERVER_ROUTES_ID}`;
const VIRTUAL_CLIENT_ROUTES_ID = `${VIRTUAL_PREFIX}${CLIENT_ROUTES_ID}`;
