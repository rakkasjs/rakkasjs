import { Command } from "commander";
import { build } from "vite";
import { loadConfig } from "../lib/config";
import { makeViteConfig } from "../lib/vite-config";

export default function buildCommand() {
	return new Command("build")
		.description("Build for production")
		.action(async () => {
			const { config, deps } = await loadConfig();

			await build({
				...makeViteConfig(config, deps),

				build: {
					outDir: "../dist/client",
					emptyOutDir: true,
					ssrManifest: true,
				},
			});

			await build({
				...makeViteConfig(config, deps),

				build: {
					ssr: true,
					outDir: "../dist/server",
					rollupOptions: {
						input: ["@rakkasjs/runner-node"],
					},
					emptyOutDir: true,
				},
			});
		});
}
