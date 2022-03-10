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
						},
					},
				],

				ssr: {
					noExternal: ["rakkasjs"],
				},
			} as UserConfig & { ssr: SSROptions };
		},
	};
}
