import esbuild from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";

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
			watch: process.argv[2] === "--watch",
		})
		.catch(() => process.exit(1));
}

run();
