import { Plugin } from "vite";
import { transformAsync } from "@babel/core";
import { babelTransformClientSidePages } from "../run-server-side/implementation/transform/transform-client-page";
import { PageRouteDefinition } from "../../vite-plugin/rakkas-plugins";

export default function pages(): Plugin {
	let command: "serve" | "build";
	let sourcemap: boolean;
	let isPage: (id: string) => boolean;
	let isLayout: (id: string) => boolean;

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

		configResolved(config) {
			command = config.command;
			sourcemap = !!config.build.sourcemap;
		},

		async transform(code, id, options) {
			if (options?.ssr) return;

			if (!isPage(id) && !isLayout(id)) {
				return;
			}

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

			return {
				code: result.code! + PAGE_HOT_RELOAD,
				map: result.map,
			};
		},
	};
}

const PAGE_HOT_RELOAD = `
	if (import.meta.hot) {
		import.meta.hot.accept(() => {
			rakkas.update?.();
		});
	}
`;
