/// <reference types="vavite/vite-config" />

import { defineConfig } from "vite";
import vavite from "vavite";
import rakkasCore from "@rakkasjs/core/vite-plugin";

export default defineConfig({
	buildSteps: [
		{
			name: "client",
			config: {
				build: {
					outDir: "dist/client",
					rollupOptions: {
						input: {
							index: "/src/empty.js",
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
	plugins: [
		vavite({
			handlerEntry: "/src/entry-node.ts",
		}),
		rakkasCore(),
	],
});
