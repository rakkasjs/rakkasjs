import { Plugin } from "vite";

export interface InjectConfigOptions {
	prerender: string[];
}

export function injectConfig(options: InjectConfigOptions): Plugin {
	return {
		name: "rakkasjs:inject-config",

		enforce: "pre",

		config() {
			return {
				buildSteps: [
					{
						name: "client",
						config: {
							build: {
								outDir: "dist/client",
								rollupOptions: {
									input: {
										index: "/virtual:rakkasjs:client-entry",
									},
								},
							},
						},
					},
					{
						name: "server",
						config: {
							build: {
								outDir: "dist/server",
								ssr: true,
							},
							rollupOptions: {
								input: {
									"hattip-entry": "virtual:rakkasjs:hattip-entry",
								},
							},
						},
					},
				],

				ssr: {
					external: ["react-dom/server.browser"],
					noExternal: ["rakkasjs"],
				},

				optimizeDeps: {
					include: ["react", "react-dom", "react-dom/client"],
					exclude: [
						"rakkasjs",
						"virtual:rakkasjs:client-manifest",
						"virtual:rakkasjs:client-page-routes",
						"virtual:rakkasjs:api-routes",
						"virtual:rakkasjs:run-server-side:manifest",
						"virtual:rakkasjs:server-page-routes",
						"virtual:rakkasjs:error-page",
						"@vavite/expose-vite-dev-server",
					],
				},

				api: {
					rakkas: {
						prerender: options.prerender,
					},
				},
			};
		},

		configResolved(config) {
			if (config.command === "build" && config.build.ssr) {
				config.build.rollupOptions.input = {
					index: "/virtual:vavite-connect-server",
					hattip: "virtual:rakkasjs:hattip-entry",
				};
			}
		},
	};
}
