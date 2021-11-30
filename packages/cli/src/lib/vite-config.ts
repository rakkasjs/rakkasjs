import path from "path";
import { InlineConfig, normalizePath, SSROptions } from "vite";
import { FullConfig, RakkasDeploymentTarget } from "../..";
import { rakkasVitePlugin } from "./vite-plugin";

export interface ConfigFlavorOptions {
	configDeps?: string[];
	onConfigChange?: () => void;
	ssr?: boolean;
}

export async function makeViteConfig(
	config: FullConfig,
	deploymentTarget: RakkasDeploymentTarget,
	{ configDeps, onConfigChange, ssr }: ConfigFlavorOptions = {},
): Promise<InlineConfig & { ssr: SSROptions }> {
	const srcDir = normalizePath(path.resolve("src"));
	const publicDir = normalizePath(path.resolve("public"));
	const pagesDir = normalizePath(config.pagesDir);
	const apiDir = normalizePath(config.apiDir);

	let viteConfig = config.vite;
	if (typeof viteConfig === "function") {
		viteConfig = await viteConfig(
			onConfigChange ? undefined : ssr ? "ssr" : "client",
		);
	}

	let noExternal: true | (string | RegExp)[] = ["rakkasjs", "rakkasjs/server"];

	const ssrConf = viteConfig.ssr || {};

	if (ssrConf.noExternal === true) {
		noExternal = true;
	} else if (typeof ssrConf.noExternal === "string") {
		noExternal.push(ssrConf.noExternal);
	} else if (Array.isArray(ssrConf.noExternal)) {
		noExternal = noExternal.concat(ssrConf.noExternal);
	}

	const result: InlineConfig & { ssr: SSROptions } = {
		...viteConfig,
		configFile: false,
		root: srcDir,
		publicDir,

		server: {
			...viteConfig.server,
			middlewareMode: "ssr",
		},

		optimizeDeps: {
			...viteConfig.optimizeDeps,
			exclude: [
				...(viteConfig.optimizeDeps?.exclude || [
					"rakkasjs",
					"rakkasjs/server",
				]),
			],
			include: [
				...(viteConfig.optimizeDeps?.include || []),
				"react",
				"react-dom",
				"react-dom/server",
				"react-helmet-async",
			],
		},

		resolve: {
			...viteConfig.resolve,
			dedupe: [
				...(viteConfig.resolve?.dedupe || []),
				"react",
				"react-dom",
				"react-dom/server",
				"react-helmet-async",
			],
		},
		plugins: [
			...(viteConfig.plugins || []),
			await rakkasVitePlugin({
				srcDir,
				pagesDir,
				apiDir,
				pageExtensions: config.pageExtensions,
				endpointExtensions: config.endpointExtensions,
				apiRoot: config.apiRoot,
				configDeps,
				stripLoadFunctions: deploymentTarget === "static" && !ssr,
				babel: config.babel,
				onConfigChange,
			}),
		],
		define: {
			...viteConfig.define,
			RAKKAS_BUILD_TARGET: JSON.stringify(deploymentTarget),
		},

		ssr: {
			// This may not be required anymore
			...(viteConfig.ssr || {}),
			external: viteConfig.ssr?.external,
			noExternal,
		},
	};

	return result;
}
