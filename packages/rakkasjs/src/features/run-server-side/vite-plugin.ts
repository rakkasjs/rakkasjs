import { PluginOption, ResolvedConfig } from "vite";
import { transformAsync } from "@babel/core";
import { babelTransformServerSideHooks } from "./internal/transform-server-side";
import { babelTransformClientSideHooks } from "./internal/transform-client-side";

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
				} as any;
			},

			resolveId(id) {
				if (id === "virtual:rakkasjs:run-server-side:manifest") {
					return id;
				}
			},

			async load(id) {
				if (id === "virtual:rakkasjs:run-server-side:manifest") {
					if (resolvedConfig.command === "serve") {
						return `export default new Proxy({}, { get: (_, name) => () => import("/" + name) });`;
					} else if (!moduleManifest) {
						throw new Error("[rakkasjs:run-server-side] Cannot find manifest");
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
				if (
					!id.startsWith(resolvedConfig.root) ||
					!code.match(
						/\buseServerSideQuery|useServerSideMutation|useSSQ|useSSM\b/,
					) ||
					(!code.includes(`"rakkasjs"`) && !code.includes(`'rakkasjs'`))
				) {
					return;
				}

				let moduleId: string;
				if (resolvedConfig.command === "serve") {
					moduleId = id.slice(resolvedConfig.root.length + 1);
				} else if (moduleManifest) {
					moduleId = moduleManifest[id];
				} else {
					moduleId = (idCounter++).toString(36);
				}

				const ref = { current: false };

				// Parse with babel
				const result = await transformAsync(code, {
					filename: id,
					code: true,
					plugins: [
						options?.ssr
							? babelTransformServerSideHooks(moduleId)
							: babelTransformClientSideHooks(moduleId, ref),
					],
				});

				if (ref.current) {
					moduleIdMap[id] = moduleId;
				}

				if (result) {
					return result.code;
				} else {
					this.warn(`[rakkasjs:run-server-side]: Failed to transform ${id}`);
					return code;
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
