import { spawn } from "child_process";
import { Plugin } from "vite";

export interface InjectConfigOptions {
	prerender: string[];
}

export function injectConfig(options: InjectConfigOptions): Plugin {
	return {
		name: "rakkasjs:inject-config",

		enforce: "pre",

		async config(_, env) {
			if (!process.env.RAKKAS_BUILD_ID) {
				process.env.RAKKAS_BUILD_ID =
					env.command === "serve" ? "development" : await getBuildId();
			}

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

				envPrefix: "RAKKAS_",

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

async function getBuildId(): Promise<string> {
	return await new Promise<string>((resolve) => {
		const git = spawn("git", ["rev-parse", "HEAD"], {
			stdio: ["ignore", "pipe", "ignore"],
		});

		git.stdout.setEncoding("utf8");
		let output = "";

		git.stdout.on("data", (data) => {
			output += data;
		});

		git.on("close", (code) => {
			if (code === 0) {
				resolve(output.trim().slice(0, 11));
			} else {
				// Return a random hash if git fails
				resolve(Math.random().toString(36).substring(2, 15));
			}
		});
	});
}
