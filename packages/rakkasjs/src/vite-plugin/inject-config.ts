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
			} as UserConfig & { ssr: SSROptions };
		},
	};
}
