import { Plugin } from "vite";

export function injectConfig(): Plugin {
	return {
		name: "rakkasjs:inject-config",

		enforce: "pre",

		config(_, env) {
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
							},
						},
					},
				],

				ssr: {
					external: ["react-dom/server.browser"],
					noExternal: ["rakkasjs"],
				},

				optimizeDeps: {
					include:
						env.command === "serve" ? ["rakkasjs", "react", "react-dom"] : [],
					exclude: [
						"virtual:rakkasjs:client-manifest",
						"virtual:rakkasjs:client-page-routes",
						"virtual:rakkasjs:api-routes",
						"virtual:rakkasjs:run-server-side:manifest",
						"virtual:rakkasjs:server-page-routes",
					],
				},
			};
		},
	};
}
