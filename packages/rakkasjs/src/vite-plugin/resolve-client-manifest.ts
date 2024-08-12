import fs from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

export function resolveClientManifest(): Plugin {
	let resolvedConfig: ResolvedConfig;
	let dev = false;
	let isSsrBuild = false;

	return {
		name: "rakkasjs:resolve-client-manifest",

		enforce: "pre",

		resolveId(id, _, options) {
			if (id !== "rakkasjs:client-manifest") return;

			if (!dev && options.ssr) {
				return {
					id: path.resolve(
						resolvedConfig.root,
						resolvedConfig.build.outDir,
						"client-manifest.js",
					),
					moduleSideEffects: true,
				};
			}

			return "\0virtual:" + id;
		},

		load(id) {
			if (id !== "\0virtual:rakkasjs:client-manifest") return;

			if (dev) {
				return "export default undefined";
			}

			return "export { default } from './client-manifest.js'";
		},

		config(config, env) {
			dev = env.command === "serve";
			isSsrBuild = env.isSsrBuild ?? false;

			if (!config.build?.ssr) {
				return {
					build: {
						manifest: "_app/manifest.json",
					},
				};
			}

			if (isSsrBuild) {
				return {
					build: {
						rollupOptions: {
							output: {
								manualChunks: {
									"client-manifest": ["rakkasjs:client-manifest"],
								},
							},
						},
					},
				};
			}
		},

		configResolved(config) {
			resolvedConfig = config;
		},

		buildStart() {
			if (isSsrBuild) {
				fs.mkdirSync(path.resolve(resolvedConfig.root, "dist/server"), {
					recursive: true,
				});

				fs.writeFileSync(
					path.resolve(resolvedConfig.root, "dist/server/client-manifest.js"),
					"export default undefined",
				);
			}
		},

		closeBundle() {
			if (dev || isSsrBuild) {
				return;
			}

			const manifestPath = path.resolve(
				resolvedConfig.root,
				resolvedConfig.build.outDir,
				"_app/manifest.json",
			);

			const content = fs.readFileSync(manifestPath, "utf-8");
			fs.rmSync(manifestPath);

			fs.writeFileSync(
				path.resolve(resolvedConfig.root, "dist/server/client-manifest.js"),
				`export default ${content}`,
			);
		},
	};
}
