import type { Plugin, ResolvedConfig } from "vite";
import { type PluginItem, transformAsync } from "@babel/core";
import { babelTransformServerSideHooks } from "./implementation/transform/transform-server-side";
import { babelTransformClientSideHooks } from "./implementation/transform/transform-client-side";
import path from "node:path";
import fs from "node:fs";

export default function runServerSide(): Plugin[] {
	let idCounter = 0;
	const moduleIdMap: Record<string, string> = Object.create(null);
	const uniqueIdMap: Record<string, string> = Object.create(null);

	let resolvedConfig: ResolvedConfig;
	let moduleManifest:
		| {
				moduleIdMap: Record<string, string>;
				uniqueIdMap: Record<string, string>;
		  }
		| undefined;

	return [
		{
			name: "rakkasjs:run-server-side-manifest",

			enforce: "pre",

			config() {
				return {
					ssr: {
						noExternal: ["rakkasjs:run-server-side-manifest"],
					},
					build: {
						rollupOptions: {
							output: {
								manualChunks: {
									"run-server-side-manifest": [
										"rakkasjs:run-server-side-manifest",
									],
								},
							},
						},
					},
				};
			},

			resolveId(id) {
				if (id === "rakkasjs:run-server-side-manifest") {
					return "\0virtual:" + id;
				}
			},

			async load(id) {
				if (id === "\0virtual:rakkasjs:run-server-side-manifest") {
					if (resolvedConfig.command === "serve") {
						return `export const moduleMap = new Proxy({}, { get: (_, name) => () => import(/* @vite-ignore */ "/" + name) });`;
					} else {
						return `export const moduleMap = {}; export const idMap = {}`;
					}
				}
			},

			closeBundle() {
				if (resolvedConfig.command !== "build" || !resolvedConfig.build.ssr) {
					return;
				}

				const moduleManifest = { moduleIdMap, uniqueIdMap };

				let code = "export const moduleMap = {";

				const manifest = JSON.parse(
					fs.readFileSync(
						path.resolve(
							resolvedConfig.root,
							resolvedConfig.build.outDir,
							"_app/manifest.json",
						),
						"utf-8",
					),
				);

				for (const [filePath, moduleId] of Object.entries(
					moduleManifest.moduleIdMap,
				)) {
					const relative = path.posix.relative(resolvedConfig.root, filePath);
					let importPath = manifest[relative].file;
					if (!importPath.startsWith("./") && !importPath.startsWith("../")) {
						importPath = "./" + importPath;
					}
					code += `\n\t${JSON.stringify(
						moduleId,
					)}: () => import(${JSON.stringify(importPath)}),`;
				}

				code += "\n};\n";

				code += "export const idMap = {";

				for (const [uniqueId, callSiteId] of Object.entries(
					moduleManifest.uniqueIdMap,
				)) {
					code += `\n\t${JSON.stringify(uniqueId)}: ${JSON.stringify(
						callSiteId,
					)},`;
				}

				code += "\n};";

				fs.writeFileSync(
					path.resolve(
						resolvedConfig.root,
						resolvedConfig.build.outDir,
						"run-server-side-manifest.js",
					),
					code,
				);
			},
		},
		{
			name: "rakkasjs:run-server-side:transform",

			enforce: "post",

			configResolved(config) {
				resolvedConfig = config;
			},

			async transform(code, id, options) {
				const uniqueIds: Array<string | undefined> | undefined =
					resolvedConfig.command === "build" && options?.ssr ? [] : undefined;
				const plugins: PluginItem[] = [];
				const ref = {
					moduleId: "",
					modified: false,
					uniqueIds,
				};
				let moduleId!: string;

				if (
					code.match(
						/\buseServerSideQuery|useServerSentEvents|useServerSideMutation|useSSQ|useSSM|useSSE|runServerSideQuery|runServerSideMutation|runSSQ|runSSM|useFormMutation\b/,
					) &&
					code.includes(`"rakkasjs"`) &&
					!code.includes(`'rakkasjs'`)
				) {
					if (resolvedConfig.command === "serve") {
						moduleId = id.slice(resolvedConfig.root.length + 1);
					} else if (moduleManifest) {
						moduleId = moduleManifest.moduleIdMap[id];
					} else {
						moduleId = (idCounter++).toString(36);
					}

					moduleId = encodeURIComponent(moduleId);

					if (moduleId) {
						ref.moduleId = process.env.RAKKAS_BUILD_ID + "/" + moduleId;
						plugins.push(
							options?.ssr
								? babelTransformServerSideHooks(ref)
								: babelTransformClientSideHooks(ref),
						);
					}
				}

				if (!plugins.length) {
					return;
				}

				// Transform with babel
				const result = await transformAsync(code, {
					filename: id,
					code: true,
					plugins,
					sourceMaps:
						resolvedConfig.command === "serve" ||
						!!resolvedConfig.build.sourcemap,
				}).catch((error) => {
					this.error(error.message);
				});

				if (!result) {
					return null;
				}

				if (ref.modified) {
					moduleIdMap[id] = moduleId;

					if (uniqueIds) {
						for (const [i, uniqueId] of uniqueIds.entries()) {
							if (uniqueId) {
								if (uniqueIdMap[uniqueId]) {
									this.error(`Duplicate unique ID ${uniqueId} in ${id}`);
								}
								uniqueIdMap[uniqueId] = moduleId! + "/" + i;
							}
						}
					}
				}

				return {
					code: result.code!,
					map: result.map,
				};
			},

			buildStepStart(_info, forwarded) {
				moduleManifest = forwarded;
			},

			buildStepEnd() {
				return { moduleIdMap, uniqueIdMap };
			},
		},
	];
}
