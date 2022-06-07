import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: {
			cli: "./src/cli/index.ts",
		},
		format: ["esm"],
		platform: "node",
	},
	{
		entry: { "vite-plugin": "./src/vite-plugin/index.ts" },
		format: ["esm"],
		platform: "node",
		dts: true,
	},
	{
		entry: ["./src/lib/client.ts"],
		target: "node14",
		format: ["esm"],
		platform: "node",
		shims: false,
		external: [
			"virtual:rakkasjs:api-routes",
			"virtual:rakkasjs:server-page-routes",
			"virtual:rakkasjs:client-page-routes",
			"virtual:rakkasjs:client-manifest",
			"virtual:rakkasjs:run-server-side:manifest",
			"react",
			"react/jsx-runtime",
			"react/jsx-dev-runtime",
			"react-dom",
			"react-dom/server",
			"react-dom/server.browser",
			"@vavite/expose-vite-dev-server/vite-dev-server",
		],
		dts: {
			entry: "./src/lib/index.ts",
		},
	},
	{
		entry: ["./src/lib/server.ts"],
		format: ["esm"],
		platform: "node",
		shims: false,
		external: [
			"virtual:rakkasjs:api-routes",
			"virtual:rakkasjs:server-page-routes",
			"virtual:rakkasjs:client-page-routes",
			"virtual:rakkasjs:client-manifest",
			"virtual:rakkasjs:run-server-side:manifest",
			"react",
			"react/jsx-runtime",
			"react/jsx-dev-runtime",
			"react-dom",
			"react-dom/server",
			"react-dom/server.browser",
			"@vavite/expose-vite-dev-server/vite-dev-server",
		],
	},
	{
		entry: ["./src/lib/node-adapter.ts"],
		format: ["esm"],
		platform: "node",
	},
]);
