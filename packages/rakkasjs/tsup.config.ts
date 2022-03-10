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
			"runtime/vavite-handler": "./src/runtime/vavite-handler.ts",
		},
		format: ["esm"],
		platform: "node",
		target: "node14",
		external: ["virtual:rakkasjs:api-routes"],
	},
	{
		entry: {
			index: "./src/lib/index.ts",
		},
		format: ["esm"],
		platform: "browser",
		dts: true,
	},
]);
