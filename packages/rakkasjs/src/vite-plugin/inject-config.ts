import { Plugin, SSROptions, UserConfig } from "vite";

export function injectConfig(): Plugin {
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
										rakkasClientEntry: "/virtual:rakkasjs:client-entry",
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
								// rollupOptions: {
								// 	output: {
								// 		chunkFileNames(info) {
								// 			return "assets/[name].[hash].mjs";
								// 		},
								// 	},
								// },
							},
						},
					},
				],

				ssr: {
					external: ["react-dom/server.browser"],
					noExternal: [
						"rakkasjs",
						"rakkasjs/runtime/vavite-handler",
						"rakkasjs/runtime/client-entry",
					],
				},

				optimizeDeps: {
					include: ["rakkasjs"],
					exclude: [
						"virtual:rakkasjs:client-manifest",
						"virtual:rakkasjs:client-page-routes",
						"virtual:rakkasjs:api-routes",
						"virtual:rakkasjs:run-server-side:manifest",
						"virtual:rakkasjs:server-page-routes",
						"rakkasjs/runtime/vavite-handler",
					],
				},
			} as UserConfig & { ssr: SSROptions };
		},
	};
}
