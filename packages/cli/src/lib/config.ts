import fs from "fs";
import path from "path";
import { build } from "esbuild";
import type { Config, FullConfig } from "../..";

export interface ConfigConfig {
	filename?: string;
	root?: string;
}

export async function loadConfig(configConfig: ConfigConfig = {}) {
	configConfig.root = configConfig.root ?? process.cwd();
	const filename = findConfigFile(configConfig);
	if (!filename) {
		return withDefaults({});
	}

	console.log("Loading config from", filename);
	const built = await buildFile(filename, configConfig.root);

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	let loaded = require(built);
	if (loaded.default) loaded = loaded.default;

	if (typeof loaded === "function") {
		return await withDefaults(loaded());
	}

	return withDefaults(loaded);
}

function findConfigFile(configConfig: ConfigConfig) {
	let { filename } = configConfig;

	if (!filename) {
		const candidates = [
			CONFIG_BASE_NAME + ".js",
			CONFIG_BASE_NAME + ".ts",
			CONFIG_BASE_NAME + ".mjs",
		].map((fn) => path.resolve(configConfig.root!, fn));

		const found = candidates.find((fn) => fs.existsSync(fn));
		if (!found) {
			return undefined;
		}

		filename = found;
	}

	return filename;
}

async function buildFile(filename: string, root: string) {
	const outfile = path.resolve(
		root,
		"node_modules/.rakkas",
		"rakkas.config.js",
	);

	await build({
		entryPoints: [filename],
		outfile,
		bundle: true,
		write: true,
		platform: "node",
		format: "cjs",
		plugins: [
			{
				name: "external-deps",
				setup(build) {
					build.onResolve({ filter: /.*/ }, ({ path: name }) => {
						if (
							name[0] !== "." &&
							name !== "@rakkasjs/cli" &&
							!path.isAbsolute(name)
						) {
							return {
								external: true,
							};
						}
					});
				},
			},
		],
	});

	return outfile;
}

function withDefaults(config: Config): FullConfig {
	return {
		...config,
		viteConfig: {},
	};
}

const CONFIG_BASE_NAME = "rakkas.config";
