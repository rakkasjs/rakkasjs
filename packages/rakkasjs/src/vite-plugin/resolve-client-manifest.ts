import fs from "node:fs";
import path from "node:path";
import { Plugin, ResolvedConfig } from "vite";

export function resolveClientManifest(): Plugin {
	let resolvedConfig: ResolvedConfig;
	let dev = false;

	return {
		name: "rakkasjs:resolve-client-manifest",

		enforce: "pre",

		resolveId(id, _, options) {
			if (id === "virtual:rakkasjs:client-manifest") {
				if (dev || !options.ssr) {
					return id;
				} else {
					return this.resolve(
						path.resolve(resolvedConfig.root, "dist/manifest.json"),
					);
				}
			}
		},

		load(id) {
			if (id === "virtual:rakkasjs:client-manifest") {
				return "export default undefined";
			}
		},

		config(config, env) {
			dev = env.command === "serve";

			if (!config.build?.ssr) {
				return {
					build: {
						manifest: "vite.manifest.json",
					},
				};
			}
		},

		configResolved(config) {
			resolvedConfig = config;
		},

		async closeBundle() {
			if (resolvedConfig.command === "serve" || resolvedConfig.build.ssr) {
				return;
			}

			const from = path.resolve(
				resolvedConfig.root,
				resolvedConfig.build.outDir,
				"vite.manifest.json",
			);

			await fs.promises.rename(
				from,
				resolvedConfig.root + "/dist/manifest.json",
			);
		},
	};
}
