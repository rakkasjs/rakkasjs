/// <reference types="vavite/vite-config" />

import { defineConfig, Plugin } from "vite";
import vavite from "vavite";
import rakkasCore from "@rakkasjs/core/vite-plugin";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";

export default defineConfig({
	buildSteps: [
		{
			name: "client",
			config: {
				build: {
					outDir: "dist/client",
					rollupOptions: {
						input: {
							index: "/src/routes/main.client.ts",
						},
					},
					manifest: true,
				},
			},
		},
		{
			name: "server",
			config: {
				build: {
					ssr: true,
					outDir: "dist/server",
					rollupOptions: {
						output: {},
					},
				},
			},
		},
	],
	build: {
		manifest: true,
	},
	plugins: [
		vavite({
			handlerEntry: "/src/entry-node.ts",
			serveClientAssetsInDev: true,
			clientAssetsDir: "dist/client",
		}),
		react(),
		rakkasCore(),
		resolveClientBuildOutputDir(),
	],
});

function resolveClientBuildOutputDir(): Plugin {
	let isDev = false;

	return {
		name: "resolve-vite-manifest",

		enforce: "pre",

		configResolved(config) {
			isDev = config.command === "serve";
		},

		resolveId(id) {
			if (id.startsWith("$client/")) {
				return isDev
					? "\0virtual:empty-client-file"
					: fileURLToPath(new URL("./dist/" + id.slice(1), import.meta.url));
			}
		},

		load(id) {
			if (id === "\0virtual:empty-client-file") {
				return "export default undefined";
			}
		},
	};
}
