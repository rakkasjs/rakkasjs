import esbuild from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import alias from "esbuild-plugin-alias";
import path from "path";
import { createRequire } from "module";
import fs from "fs";

async function run() {
	console.log("Building CLI");
	await esbuild
		.build({
			bundle: true,
			logLevel: "info",
			entryPoints: ["src/bin.ts", "src/index.ts"],
			outdir: "dist",
			platform: "node",
			target: ["node12"],
			format: "cjs",
			plugins: [nodeExternalsPlugin()],
			watch: process.argv[2] === "--watch",
		})
		.catch(() => process.exit(1));

	const nodeRuntimeExternals = [
		"$output/server.js",
		"$output/api-routes.js",
		"$output/page-routes.js",
		"$output/rakkas-manifest.json",
		"$output/html-template.js",
	];

	function lateResolvePlugin() {
		return {
			name: "late-resolve",
			setup(build) {
				build.onResolve({ filter: /^\$output\// }, (args) => {
					return {
						path: "." + args.path.slice("$output".length),
						external: true,
					};
				});
			},
		};
	}

	console.log("Building Node dev runtime");
	await esbuild
		.build({
			bundle: true,
			logLevel: "info",
			entryPoints: ["src/runtime/handle-node-request.ts"],
			outdir: "dist/entries",
			platform: "node",
			target: ["node14"],
			format: "esm",
			external: [
				...nodeRuntimeExternals,
				"react",
				"react-dom",
				"react-helmet-async",
			],
			plugins: [lateResolvePlugin(), nodeExternalsPlugin()],
			watch: process.argv[2] === "--watch",
		})
		.catch(() => process.exit(1));

	console.log("Building Node runtime");
	await esbuild
		.build({
			bundle: true,
			logLevel: "info",
			entryPoints: ["src/runtime/entry-node.ts"],
			outdir: "dist/entries",
			platform: "node",
			target: ["esnext"],
			format: "cjs",
			external: nodeRuntimeExternals,
			plugins: [lateResolvePlugin(), nodeExternalsPlugin()],
			watch: process.argv[2] === "--watch",
		})
		.catch(() => process.exit(1));

	console.log("Building Vercel runtime");
	await esbuild
		.build({
			bundle: true,
			logLevel: "info",
			entryPoints: ["src/runtime/entry-vercel.ts"],
			outdir: "dist/entries",
			platform: "node",
			target: ["node12"],
			external: nodeRuntimeExternals,
			plugins: [lateResolvePlugin()],
			watch: process.argv[2] === "--watch",
		})
		.catch(() => process.exit(1));

	console.log("Building Netlify runtime");
	await esbuild
		.build({
			bundle: true,
			logLevel: "info",
			entryPoints: ["src/runtime/entry-netlify.ts"],
			outdir: "dist/entries",
			platform: "node",
			target: ["node12"],
			external: nodeRuntimeExternals,
			plugins: [lateResolvePlugin()],
			watch: process.argv[2] === "--watch",
		})
		.catch(() => process.exit(1));

	console.log("Building Cloudflare Workers runtime");
	await esbuild
		.build({
			bundle: true,
			logLevel: "info",
			entryPoints: ["src/runtime/entry-cloudflare-workers.ts"],
			outdir: "dist/entries",
			platform: "node",
			target: ["node12"],
			external: nodeRuntimeExternals,
			plugins: [lateResolvePlugin()],
			watch: process.argv[2] === "--watch",
		})
		.catch(() => process.exit(1));
}

run();
