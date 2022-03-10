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
			"runtime/client-entry": "./src/runtime/client-entry.tsx",
		},
		format: ["esm"],
		platform: "node",
		target: "node14",
		shims: false,
		external: [
			"virtual:rakkasjs:api-routes",
			"virtual:rakkasjs:server-page-routes",
			"virtual:rakkasjs:client-page-routes",
			"virtual:rakkasjs:client-manifest",
			"react",
			"react/jsx-runtime",
			"react/jsx-dev-runtime",
			"react-dom",
			"react-dom/server",
			"@vavite/expose-vite-dev-server/vite-dev-server",
		],
	},
	{
		entry: {
			index: "./src/lib/index.ts",
		},
		format: ["esm"],
		platform: "browser",
		shims: false,
		dts: true,
	},
]);
