import { PluginOption, ResolvedConfig } from "vite";
import { PluginItem, transformAsync } from "@babel/core";
import { babelTransformServerSideHooks } from "./implementation/transform-server-side";
import { babelTransformClientSideHooks } from "./implementation/transform-client-side";

export default function runServerSide(): PluginOption[] {
	let idCounter = 0;
	const moduleIdMap: Record<string, string> = {};

	let resolvedConfig: ResolvedConfig;
	let moduleManifest: any;

	return [
		{
			name: "rakkasjs:run-server-side:manifest",

			enforce: "pre",

			config() {
				return {
					ssr: {
						noExternal: ["virtual:rakkasjs:run-server-side:manifest"],
					},
				};
			},

			resolveId(id) {
				if (id === "virtual:rakkasjs:run-server-side:manifest") {
					return id;
				}
			},

			async load(id) {
				if (id === "virtual:rakkasjs:run-server-side:manifest") {
					if (resolvedConfig.command === "serve") {
						return `export default new Proxy({}, { get: (_, name) => () => import(/* @vite-ignore */ "/" + name) });`;
					} else if (!moduleManifest) {
						return `throw new Error("[virtual:rakkasjs:run-server-side:manifest]: Module manifest is not available on the client");`;
					}

					let code = "export default {";

					for (const [filePath, moduleId] of Object.entries(moduleManifest)) {
						code += `\n\t${JSON.stringify(
							moduleId,
						)}: () => import(${JSON.stringify("/" + filePath)}),`;
					}

					code += "\n};";
					return code;
				}
			},
		},
		{
			name: "rakkasjs:run-server-side:transform",

			enforce: "post",

			configResolved(config) {
				resolvedConfig = config;
			},

			async transform(code, id, options) {
				const plugins: PluginItem[] = [];
				const ref = { current: false };
				let moduleId: string;

				if (
					id.startsWith(resolvedConfig.root) &&
					code.match(
						/\buseServerSideQuery|useServerSideMutation|useSSQ|useSSM|runServerSideQuery|runServerSideMutation|runSSQ|runSSM|useFormMutation\b/,
					) &&
					code.includes(`"rakkasjs"`) &&
					!code.includes(`'rakkasjs'`)
				) {
					if (resolvedConfig.command === "serve") {
						moduleId = id.slice(resolvedConfig.root.length + 1);
					} else if (moduleManifest) {
						moduleId = moduleManifest[id];
					} else {
						moduleId = (idCounter++).toString(36);
					}

					plugins.push(
						options?.ssr
							? babelTransformServerSideHooks(moduleId)
							: babelTransformClientSideHooks(moduleId, ref),
					);
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
				});

				if (ref.current) {
					moduleIdMap[id] = moduleId!;
				}

				if (result) {
					return {
						code: result.code!,
						map: result.map,
					};
				} else {
					this.warn(`[rakkasjs:run-server-side]: Failed to transform ${id}`);
				}
			},

			buildStepStart(_info, forwarded) {
				moduleManifest = forwarded;
			},

			buildStepEnd() {
				return moduleIdMap;
			},
		},
	];
}
