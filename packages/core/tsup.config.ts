import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: { "vite-plugin": "./src/vite-plugin/vite-plugin.ts" },
		format: ["esm"],
		platform: "node",
		dts: true,
	},
	{
		entry: { server: "./src/server/server.ts" },
		format: ["esm"],
		platform: "neutral",
		dts: true,
	},
	{
		entry: { client: "./src/client/client.ts" },
		format: ["esm"],
		platform: "browser",
	},
]);
