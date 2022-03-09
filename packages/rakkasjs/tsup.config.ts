import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: {
			cli: "./src/cli/index.ts",
		},
		format: ["cjs"],
		platform: "node",
		target: "node14",
	},
	{
		entry: { "vite-plugin": "./src/vite-plugin/index.ts" },
		format: ["cjs"],
		platform: "node",
		target: "node14",
		dts: true,
	},
	{
		entry: {
			"entries/vavite-handler": "./src/entries/vavite-handler.ts",
		},
		format: ["esm"],
		platform: "node",
		target: "node14",
	},
]);
