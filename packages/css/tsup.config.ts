import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["./src/index.ts", "./src/vite-plugin.ts", "./src/server-hooks.ts"],
		format: ["esm"],
		platform: "node",
		target: "node18",
		sourcemap: true,
		dts: true,
	},
]);
