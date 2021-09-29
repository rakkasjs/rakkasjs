import fs from "fs";
import path from "path";
import { build } from "esbuild";
import type { Config, FullConfig } from "../..";
import chalk from "chalk";

export interface ConfigConfig {
	filename?: string;
	root?: string;
	collectDeps?: boolean;
}

export async function loadConfig(configConfig: ConfigConfig = {}): Promise<{
	config: FullConfig;
	deps?: string[];
}> {
	configConfig.root = configConfig.root ?? process.cwd();
	const filename = findConfigFile(configConfig);
	if (!filename) {
		return { config: withDefaults({}), deps: [] };
	}

	// eslint-disable-next-line no-console
	console.log(chalk.blue("Loading config from"), filename);
	const { outfile, deps } = await buildFile(
		filename,
		configConfig.root,
		configConfig.collectDeps,
	);

	delete require.cache[require.resolve(outfile)];
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	let loaded = require(outfile);

	// Poor man's esModuleInterop
	while (loaded.default) loaded = loaded.default;

	if (typeof loaded === "function") {
		loaded = await loaded();
	}

	return {
		config: withDefaults(loaded),
		deps,
	};
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

async function buildFile(filename: string, root: string, collectDeps = true) {
	const outfile = path.resolve(
		root,
		"node_modules/.rakkas",
		"rakkas.config.cjs",
	);

	const buildResult = await build({
		entryPoints: [filename],
		outfile,
		bundle: true,
		write: true,
		platform: "node",
		format: "cjs",
		metafile: collectDeps,
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

	return {
		outfile,
		deps: collectDeps
			? Object.keys(buildResult.metafile!.inputs).map((fn) => path.resolve(fn))
			: undefined,
	};
}

function withDefaults(config: Config): FullConfig {
	const out: FullConfig = {
		vite: {},
		pagesDir: "pages",
		pageExtensions: ["jsx", "tsx"],
		apiDir: "api",
		apiRoot: "/api",
		endpointExtensions: ["js", "ts"],
		trustForwardedOrigin: false,
		babel: {},
		...config,
	};

	return out;
}

const CONFIG_BASE_NAME = "rakkas.config";
