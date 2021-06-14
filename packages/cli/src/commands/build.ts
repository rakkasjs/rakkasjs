import { Command } from "commander";
import { build } from "vite";
import path from "path";

export default function buildCommand() {
	return new Command("build")
		.description("Build for production")
		.action(async () => {
			await build({
				build: {
					outDir: "dist/client",
				},
				resolve: {
					alias: {
						"$app": "",
						"$rakkas": "@rakkasjs/core/dist",
					},
				},
				plugins: [
					{
						name: "rakkas-index-html",
						enforce: "pre",
						resolveId(id) {
							if (id === path.resolve("index.html")) {
								return id;
							}
						},
						load(id) {
							if (id === path.resolve("index.html")) return template;
						},
					},
				],
			});

			await build({
				build: {
					ssr: true,
					outDir: "dist/server",
					rollupOptions: {
						input: ["@rakkasjs/runner-node"],
						external: ["fs"],
					},
				},
				resolve: {
					alias: {
						"$app": "",
						"$rakkas": "@rakkasjs/core",
					},
				},
			});
		});
}

const template = `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta http-equiv="X-UA-Compatible" content="ie=edge" />
		<!-- rakkas-head-placeholder -->
	</head>
	<body>
		<div id="rakkas-app"><!-- rakkas-app-placeholder --></div>
		<script type="module" src="/src/client"></script>
	</body>
</html>`;
