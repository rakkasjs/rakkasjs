import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: { server: "./src/server/server.ts" },
		format: ["esm"],
		platform: "neutral",
		dts: true,
	},
]);
