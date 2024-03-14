import { Plugin } from "vite";
import { transformAsync } from "@babel/core";
import { babelTransformClientSidePages } from "../run-server-side/implementation/transform/transform-client-page";
import { PageRouteDefinition } from "../../vite-plugin/rakkas-plugins";
import { init, parse } from "es-module-lexer";

export default function pages(): Plugin {
	let command: "serve" | "build";
	let sourcemap: boolean;
	let isPage: (id: string) => boolean;
	let isLayout: (id: string) => boolean;

	const transformSet = new Set<string>();

	return {
		name: "rakkasjs:strip-server-exports",

		api: {
			rakkas: {
				routesResolved(routes) {
					const pages = routes.filter(
						(r) => r.type === "page",
					) as PageRouteDefinition[];
					const pageSet = new Set<string>();
					const layoutSet = new Set<string>();

					for (const page of pages) {
						pageSet.add(page.page);
						if (page.layouts) {
							for (const layout of page.layouts) {
								layoutSet.add(layout);
							}
						}
					}

					isPage = (id: string) => pageSet.has(id);
					isLayout = (id: string) => layoutSet.has(id);
				},
			},
		},

		enforce: "pre",

		configResolved(config) {
			command = config.command;
			sourcemap = !!config.build.sourcemap;
		},

		async resolveId(source, importer, options) {
			// TODO: Using module meta would be better but there seems to be a bug in Vite
			if (options.ssr) {
				return;
			}

			const resolved = await this.resolve(source, importer, {
				...options,
				skipSelf: true,
			});

			if (!resolved) return null;

			if (isPage(source) || isLayout(source)) {
				transformSet.add(resolved.id);
			} else {
				transformSet.delete(resolved.id);
			}

			return resolved;
		},

		transform: {
			order: "post",

			async handler(code, id, options) {
				if (options?.ssr || !transformSet.has(id)) return;

				const result = await transformAsync(code, {
					filename: id,
					code: true,
					plugins: [babelTransformClientSidePages()],
					sourceMaps: command === "serve" || sourcemap,
				}).catch((error) => {
					this.error(error.message);
				});

				if (!result) {
					return null;
				}

				let output = result.code ?? "";
				if (command === "serve") {
					await init;
					const [, exports] = parse(output);

					if (!exports.some((e) => e.n === "default")) {
						output += `export default { moduleId: ${JSON.stringify(this.getModuleInfo(id)?.id ?? id)} };\n`;
					}

					output += PAGE_HOT_RELOAD;
				}

				return {
					code: output,
					map: result.map,
				};
			},
		},
	};
}

const PAGE_HOT_RELOAD = `
	if (import.meta.hot) {
		RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
			import.meta.hot.accept((nextExports) => {
				if (currentExports.default) {
					currentExports.default.preload = nextExports.default?.preload;
				}
				rakkas.update?.();
			});
		});
	}
`;
