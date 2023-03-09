import { spawn } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Plugin, UserConfig } from "vite";
import { RakkasAdapter } from "./adapters";
import glob from "fast-glob";
import { BuildStep } from "@vavite/multibuild";
import pico from "picocolors";
import micromatch from "micromatch";
import { RouteConfig } from "../lib";

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
							rollupOptions: {
								input: {
									index: "/virtual:vavite-connect-server",
									hattip: "virtual:rakkasjs:hattip-entry",
								},
							},
						},
					},
				},
			];

			return {
				buildSteps,

				ssr: {
					external: ["react-dom/server.browser"],
					noExternal: ["rakkasjs", "@vavite/expose-vite-dev-server"],
					optimizeDeps: {
						exclude: [
							"rakkasjs",
							"@vavite/expose-vite-dev-server",
							"virtual:rakkasjs:client-manifest",
							"virtual:rakkasjs:client-page-routes",
							"virtual:rakkasjs:api-routes",
							"virtual:rakkasjs:run-server-side:manifest",
							"virtual:rakkasjs:server-page-routes",
							"virtual:rakkasjs:error-page",
						],
					},
				},

				appType: "custom",

				optimizeDeps: {
					include: ["react", "react-dom", "react-dom/client"],
					// TODO: Remove this when https://github.com/vitejs/vite/pull/8917 is merged
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

		async configResolved(config) {
			const routeConfigFiles = await glob(
				config.root + "/src/routes/**/route.config.js",
			);

			const routeConfigContents = await Promise.allSettled(
				routeConfigFiles.map((file) => {
					const specifier = pathToFileURL(file) + `?${cacheBuster}`;
					return import(specifier).then((module) => module.default);
				}),
			);
			cacheBuster++;

			const routeConfigs = routeConfigContents.map((result, i) => ({
				file: routeConfigFiles[i].slice(
					config.root.length + "/src/routes/".length,
				),
				...result,
			}));

			const failed = routeConfigs.find(
				(c) => c.status === "rejected",
			) as PromiseRejectedResult & { file: string };

			if (failed) {
				const message = `Failed to load ${failed.file}: ${failed.reason.stack}`;
				if (config.command === "build") {
					throw new Error(message);
				} else {
					config.logger.error(pico.red(message));
				}
			}

			config.configFileDependencies.push(...routeConfigFiles);

			// Illegally write to the config object
			// Rakkas will only access these late in the process
			const writable = config as unknown as UserConfig;

			writable.api = writable.api || {};
			writable.api.rakkas = writable.api.rakkas || {};
			writable.api.rakkas.routeConfigs = [];

			for (const routeConfig of routeConfigs) {
				if (routeConfig.status === "fulfilled") {
					try {
						const value =
							typeof routeConfig.value === "function"
								? routeConfig.value(config)
								: routeConfig.value;

						writable.api.rakkas.routeConfigs.push({
							dir: routeConfig.file
								.slice(0, -"route.config.js".length)
								.replace(/\\/g, "/"),
							value,
						});
					} catch (error: any) {
						const message = `Failed to evaluate ${routeConfig.file}: ${error?.stack}`;
						if (config.command === "build") {
							throw new Error(message);
						} else {
							config.logger.error(pico.red(message));
						}
					}
				}
			}

			// Shortest first
			writable.api!.rakkas.routeConfigs.sort(
				(a, b) => a.dir.length - b.dir.length,
			);
		},

		configureServer(server) {
			const isRouteConfigFile = micromatch.matcher(
				server.config.root + "/src/routes/**/route.config.js",
			);

			server.watcher.addListener("all", (ev: string, file: string) => {
				if (isRouteConfigFile(file) && (ev === "add" || ev === "unlink")) {
					server.config.logger.info(
						pico.green(
							`${path.relative(
								process.cwd(),
								file,
							)} changed, restarting server...`,
						),
						{ clear: true, timestamp: true },
					);
					server.restart().catch(() => {
						// Ignore
					});
				}
			});
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

let cacheBuster = 0;

declare module "vite" {
	interface UserConfig {
		api?: {
			rakkas?: {
				prerender?: string[];
				adapter?: RakkasAdapter;
				routeConfigs?: Array<{
					dir: string;
					value: RouteConfig;
				}>;
			};
		};
	}
}
