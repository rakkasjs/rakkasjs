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

	async function generateRoutesModule(client?: string) {
		const cwd = path.join(config.root, ROUTES_DIR);

		const reducedClient = client && client.slice(ROUTES_DIR.length + 1) + "/";

		function getPath(filename: string) {
			const dir = path.dirname(filename).replace(/\\/g, "/");
			return dir === "." ? "/" : "/" + dir + "/";
		}

		let wrapperIndex = 1;
		let wrapperImporters = "";

		const wrappers = (await glob(WRAPPER_PATTERN, { cwd }))
			.map((filename) => {
				const importSpecifier =
					"/" + path.join(ROUTES_DIR, filename).replace(/\\/g, "/");
				const name = `w${wrapperIndex++}`;
				const quoted = JSON.stringify(importSpecifier);

				wrapperImporters += `const ${name} = [${quoted}, () => import(${quoted})];\n`;

				return {
					name,
					importSpecifier,
					path: getPath(filename),
				};
			})
			.sort((a, b) => a.path.length - b.path.length);

		let clientIndex = 1;
		let clientNames = "";

		const clients = client
			? []
			: (await glob(CLIENT_PATTERN, { cwd }))
					.map((filename) => {
						const importSpecifier =
							"/" + path.join(ROUTES_DIR, filename).replace(/\\/g, "/");
						const name = `c${clientIndex++}`;

						clientNames += `const ${name} = ${JSON.stringify(
							importSpecifier,
						)};\n`;

						return {
							name,
							importSpecifier,
							path: getPath(filename),
						};
					})
					.sort((b, a) => a.path.length - b.path.length);

		let routeIndex = 1;
		let routeImporters = "";

		const routes = sortRoutes(
			(await glob(ROUTE_PATTERN, { cwd }))
				.map((filename) => {
					const pathname = "/" + filename.match(/^(.*)\.(?:page|api)\./)![1];
					const importSpecifier =
						"/" + path.join(ROUTES_DIR, filename).replace(/\\/g, "/");
					const name = `r${routeIndex++}`;
					const quoted = JSON.stringify(importSpecifier);

					routeImporters += `const ${name} = [${quoted}, () => import(${quoted})];\n`;

					return {
						name,
						importSpecifier,
						path: pathname,
						regex: routeToRegExp(pathname)[0],
						parents: wrappers.filter((w) => pathname.startsWith(w.path)),
						client: clients.find((c) => pathname.startsWith(c.path)),
					};
				})
				.filter((r) => !reducedClient || r.path.startsWith(reducedClient)),
		);

		let routeExports = "export default [\n";

		for (const route of routes) {
			routeExports += `  [${route.regex}, ${route.name}, `;

			routeExports += `[${[...route.parents].map((r) => r.name).join(", ")}]`;

			if (route.client) {
				routeExports += `, ${route.client.name}`;
			}

			routeExports += `],\n`;
		}

		routeExports += "];\n";

		const output = [clientNames, wrapperImporters, routeImporters, routeExports]
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

			resolveId(id, importer) {
				if (id === SERVER_ROUTES_ID) {
					return VIRTUAL_SERVER_ROUTES_ID;
				} else if (id === CLIENT_ROUTES_ID && importer) {
					return (
						VIRTUAL_CLIENT_ROUTES_ID + "?from=" + encodeURIComponent(importer)
					);
				}
			},

			async load(id) {
				if (id === VIRTUAL_SERVER_ROUTES_ID) {
					return generateRoutesModule();
				} else if (id.startsWith(VIRTUAL_CLIENT_ROUTES_ID + "?from=")) {
					const importer = decodeURIComponent(
						id.slice(VIRTUAL_CLIENT_ROUTES_ID.length + 6),
					);

					const clientDir = path.dirname(
						importer.slice(config.root.length + 1),
					);

					return generateRoutesModule(clientDir);
				}
			},
		},
	];
}

const ROUTES_DIR = "src/routes";

const ROUTE_PATTERN = `**/*.(page|api).*`;
const WRAPPER_PATTERN = `**/(*.|)(layout|middleware).*`;
const CLIENT_PATTERN = `**/*.client.*`;

const MODULE_PREFIX = "rakkasjs:";
const VIRTUAL_PREFIX = "\0virtual:";
const SERVER_ROUTES_ID = `${MODULE_PREFIX}server-routes`;
const CLIENT_ROUTES_ID = `${MODULE_PREFIX}client-routes`;
const VIRTUAL_SERVER_ROUTES_ID = `${VIRTUAL_PREFIX}${SERVER_ROUTES_ID}`;
const VIRTUAL_CLIENT_ROUTES_ID = `${VIRTUAL_PREFIX}${CLIENT_ROUTES_ID}`;
