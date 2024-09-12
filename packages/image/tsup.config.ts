import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["./src/index.tsx", "./src/vite-plugin.ts", "./src/handler.ts"],
		format: ["esm"],
		platform: "node",
		target: "node18",
		sourcemap: true,
		dts: true,
	},
]);
