import { spawn } from "node:child_process";
import { Plugin } from "vite";
import { RakkasAdapter } from "./adapters";
import { BuildStep } from "@vavite/multibuild";

export interface InjectConfigOptions {
	prerender: string[];
	adapter: RakkasAdapter;
	strictMode: boolean;
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

			if (options.adapter.disableStreaming) {
				process.env.RAKKAS_DISABLE_STREAMING = "true";
			} else {
				process.env.RAKKAS_DISABLE_STREAMING = "false";
			}

			const buildSteps: BuildStep[] = [
				{
					name: "client",
					config: {
						build: {
							outDir: "dist/client",
							rollupOptions: {
								input: {
									index: "/rakkasjs:client-entry",
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
							rollupOptions: {
								input: {
									index: "/virtual:vavite-connect-server",
									hattip: "rakkasjs:hattip-entry",
								},
							},
							target: "node18",
						},
					},
				},
			];

			return {
				buildSteps,

				build: {
					assetsDir: "_app/assets",
				},

				ssr: {
					external: ["react-dom/server.browser"],
					noExternal: ["rakkasjs", "@vavite/expose-vite-dev-server"],
					optimizeDeps: {
						exclude: [
							"rakkasjs",
							"@vavite/expose-vite-dev-server",
							"rakkasjs:client-manifest",
							"rakkasjs:client-page-routes",
							"rakkasjs:api-routes",
							"rakkasjs:run-server-side:manifest",
							"rakkasjs:server-page-routes",
							"rakkasjs:error-page",
						],
					},
				},

				appType: "custom",

				optimizeDeps: {
					include: ["react", "react-dom", "react-dom/client"],
					// TODO: Remove this when https://github.com/vitejs/vite/pull/8917 is merged
					exclude: [
						"rakkasjs",
						"rakkasjs:client-manifest",
						"rakkasjs:client-page-routes",
						"rakkasjs:api-routes",
						"rakkasjs:run-server-side:manifest",
						"rakkasjs:server-page-routes",
						"rakkasjs:error-page",
						"@vavite/expose-vite-dev-server",
					],
				},

				envPrefix: "RAKKAS_",

				api: {
					rakkas: {
						prerender: options.prerender,
						adapter: options.adapter,
					},
				},

				define: {
					"process.env.RAKKAS_STRICT_MODE": JSON.stringify(
						options.strictMode.toString(),
					),
				},
			};
		},
	};
}

async function getBuildId(): Promise<string> {
	return await new Promise<string>((resolve, reject) => {
		const git = spawn("git", ["rev-parse", "HEAD"], {
			stdio: ["ignore", "pipe", "ignore"],
		});

		git.stdout.setEncoding("utf8");
		let output = "";

		git.stdout.on("data", (data) => {
			output += data;
		});

		git.on("error", (err) => reject(err));

		git.on("close", (code) => {
			if (code === 0) {
				resolve(output.trim().slice(0, 11));
			} else {
				reject(new Error());
			}
		});
	}).catch(() => {
		// Return a random hash if git fails
		return Math.random().toString(36).substring(2, 15);
	});
}
