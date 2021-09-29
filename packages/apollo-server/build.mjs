import esbuild from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";

async function run() {
	esbuild
		.build({
			bundle: true,
			logLevel: "info",
			entryPoints: ["src/index.ts"],
			outdir: "dist",
			platform: "node",
			target: ["node12"],
			plugins: [nodeExternalsPlugin()],
			watch: process.argv[2] === "--watch",
		})
		.catch(() => process.exit(1));
}

run();
