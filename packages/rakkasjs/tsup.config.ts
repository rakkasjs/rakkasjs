import fs from "node:fs";
import { defineConfig } from "tsup";

function namedExports() {
	return {
		name: "named-exports",

		buildEnd(ctx: { writtenFiles: Array<{ name: string }> }) {
			if (!ctx.writtenFiles[0]) return;
			const filename = ctx.writtenFiles[0].name;
			const src = fs.readFileSync(filename, "utf8");

			const matches = src.matchAll(
				/\bimport(?:(\s+[a-zA-Z0-9]+\s*),?)?\s*(\{[^}]*\})?\s*from\s*["']react["'];?/gm,
			);

			let out = src;
			let n = 1;
			for (const match of matches) {
				const content = match[0];
				const defaultImport = match[1]?.trim() || `__REACT_IMPORT__${n++}`;
				const namedImports = match[2]?.trim().replace(/\s+as\s+/gm, ": ");

				let replacement = `import * as ${defaultImport} from "react";`;
				if (namedImports) {
					replacement += `\nconst ${namedImports} = ${defaultImport};`;
				}

				out = out.replace(content, replacement);
			}

			fs.writeFileSync(filename, out);
		},
	};
}

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
		entry: {
			"index.client": "./src/lib/index.client.ts",
			client: "./src/runtime/client-entry.tsx",
		},
		target: "node18",
		format: ["esm"],
		platform: "node",
		shims: false,
		external: [
			/^rakkasjs:/,
			"react",
			"react/jsx-runtime",
			"react/jsx-dev-runtime",
			"react-dom",
			"react-dom/server",
			"react-dom/server.browser",
			"@vavite/expose-vite-dev-server/vite-dev-server",
		],
		noExternal: [
			"react-error-boundary",
			"@brillout/json-serializer/parse",
			"@brillout/json-serializer/stringify",
			"@microsoft/fetch-event-source",
		],
		dts: {
			entry: {
				index: "./src/lib/index.client.ts",
				client: "./src/runtime/client-entry.tsx",
				server: "./src/runtime/hattip-handler.ts",
			},
		},
		plugins: [namedExports()],
	},
	{
		entry: {
			"index.server": "./src/lib/index.server.ts",
			server: "./src/runtime/hattip-handler.ts",
		},
		format: ["esm"],
		platform: "node",
		shims: false,
		external: [
			/^rakkasjs:/,
			"node:async_hooks",
			"react",
			"react/jsx-runtime",
			"react/jsx-dev-runtime",
			"react-dom",
			"react-dom/server",
			"react-dom/server.browser",
			"@vavite/expose-vite-dev-server/vite-dev-server",
		],
		noExternal: [
			"@brillout/json-serializer/parse",
			"@brillout/json-serializer/stringify",
			"@microsoft/fetch-event-source",
		],
		plugins: [namedExports()],
	},
	{
		entry: ["./src/lib/node-adapter.ts"],
		format: ["esm"],
		platform: "node",
		dts: true,
	},
]);
