import esbuild from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import alias from "esbuild-plugin-alias";

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
			plugins: [nodeExternalsPlugin()],
			watch: process.argv[2] === "--watch",
		})
		.catch(() => process.exit(1));

	const nodeRuntmeExternals = [
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
			target: ["node12"],
			format: "esm",
			external: nodeRuntmeExternals,
			plugins: [lateResolvePlugin()],
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
			target: ["node12"],
			external: nodeRuntmeExternals,
			plugins: [lateResolvePlugin()],
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
			external: nodeRuntmeExternals,
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
			external: nodeRuntmeExternals,
			plugins: [lateResolvePlugin()],
			watch: process.argv[2] === "--watch",
		})
		.catch(() => process.exit(1));
}

run();
