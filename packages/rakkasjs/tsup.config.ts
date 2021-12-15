import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.tsx", "src/server.tsx", "src/client.tsx"],
	external: [
		"@rakkasjs/server-hooks",
		"@rakkasjs/client-hooks",
		"@rakkasjs/page-imports",
		"@rakkasjs/api-imports",
	],
	format: ["esm"],
	dts: true,
	clean: true,
	target: "esnext",
	shims: false,
});
