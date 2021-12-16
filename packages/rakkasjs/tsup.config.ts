import { defineConfig } from "tsup";

export default defineConfig({
	entry: [
		"src/index.tsx",
		"src/server.tsx",
		"src/client.tsx",
		"src/placeholder-loader.tsx",
	],
	external: [
		"virtual:rakkasjs:server-hooks",
		"virtual:rakkasjs:client-hooks",
		"virtual:rakkasjs:page-imports",
		"virtual:rakkasjs:api-imports",
		"virtual:rakkasjs:placeholder",
	],
	format: ["esm"],
	dts: true,
	clean: true,
	target: "esnext",
	shims: false,
});
