import { Command } from "commander";
import { createServer as createViteServer, ViteDevServer } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { createServer } from "http";
import { encode } from "html-entities";
import glob from "fast-glob";
import fs from "fs/promises";
import path from "path";

export default function devCommand() {
	return new Command("dev")
		.description("Start a development server")
		.action(async () => {
			const runtimePath = path.resolve(__dirname, "../runtime/") + "/";

			// Create vite server in middleware mode. This disables Vite's own HTML
			// serving logic and let the parent server take control.
			let viteServer: ViteDevServer;
			const injectedFiles = ["server.tsx", "routes.tsx"];
			const generatedFiles = ["pages", "layouts"];

			const vite = await createViteServer({
				server: { middlewareMode: true },
				plugins: [
					reactRefresh(),
					{
						name: "rakkas",
						enforce: "pre",
						configureServer(server) {
							viteServer = server;
							viteServer.watcher.on("all", (e, fileName) => {
								if (e === "change") return;
								const pagesDir = path.resolve("./src/pages");
								if (fileName.startsWith(pagesDir + "/")) {
									fileName = fileName.slice(pagesDir.length + 1);
									if (fileName.match(/^((.+)[\./])?page\.[a-zA-Z0-9]+$/)) {
										const mdl =
											viteServer.moduleGraph.getModuleById("@rakkasjs:pages");
										if (mdl) {
											viteServer.moduleGraph.invalidateModule(mdl);
											viteServer.watcher.emit("change", "@rakkasjs:pages");
										}
									} else if (
										fileName.match(/^((.+)[\./])?layout\.[a-zA-Z0-9]+$/)
									) {
										const mdl =
											viteServer.moduleGraph.getModuleById("@rakkasjs:layouts");
										if (mdl) {
											viteServer.watcher.emit("change", "@rakkasjs:layouts");
										}
									}
								}
							});
						},
						resolveId(src) {
							if (
								src.startsWith("@rakkasjs:") ||
								src.startsWith("/@rakkasjs:")
							) {
								const filename = src.slice(src.indexOf(":") + 1);
								if (
									injectedFiles.includes(filename) ||
									generatedFiles.includes(filename)
								) {
									return `@rakkasjs:${filename}`;
								}
							}
						},

						async load(id) {
							if (!id.startsWith("@rakkasjs:")) return;

							const moduleName = id.slice(id.indexOf(":") + 1);
							if (injectedFiles.includes(moduleName)) {
								const fileName = path.resolve(runtimePath, moduleName);

								const code = await fs.readFile(fileName, {
									encoding: "utf-8",
								});

								this.addWatchFile(fileName);
								viteServer.watcher.on("all", (e, path) => {
									if (path === fileName) {
										const mdl = viteServer.moduleGraph.getModuleById(
											`@rakkasjs:${moduleName}`,
										);
										if (mdl) viteServer.moduleGraph.invalidateModule(mdl);
									}
								});

								return { code };
							} else if (id === "@rakkasjs:pages") {
								return glob("./src/pages/**/(*.)?page.[[:alnum:]]+").then(
									(paths) => {
										return {
											code: `export default [${paths.map(
												(path) =>
													"[" +
													JSON.stringify(path.slice(12)) +
													`, () => import(${JSON.stringify(path)})]`,
											)}]`,
										};
									},
								);
							} else if (id === "@rakkasjs:layouts") {
								return glob("./src/pages/**/(*.)?layout.[[:alnum:]]+").then(
									(paths) => {
										return {
											code: `export default [${paths.map(
												(path) =>
													"[" +
													JSON.stringify(path.slice(12)) +
													`, () => import(${JSON.stringify(path)})]`,
											)}]`,
										};
									},
								);
							}
						},

						handleHotUpdate(ctx) {
							if (ctx.file.startsWith(runtimePath)) {
								const moduleName =
									"@rakkasjs:" + ctx.file.slice(runtimePath.length);
								ctx.modules.push(
									viteServer.moduleGraph.getModuleById(moduleName),
								);
							}
						},
					},
				],
				resolve: {
					alias: {
						"$app": "",
						"$rakkas": "@rakkasjs/core/dist",
					},
				},
			});

			const app = createServer({}, (req, res) => {
				const url = req.url;
				vite.middlewares(req, res, async () => {
					let output = template;
					let content: {
						data: string;
						app: string;
					};

					try {
						const { renderServerSide } = await vite.ssrLoadModule(
							"@rakkasjs:server.tsx",
						);

						output = await vite.transformIndexHtml(url, output);
						content = await renderServerSide({
							// TODO: Get real host and port
							url: new URL(url, "http://localhost:3000"),
						});
						res.statusCode = 200;
					} catch (error) {
						vite.ssrFixStacktrace(error);
						content = {
							data: "[]",
							app: encode(error.stack ?? "Unknwon error"),
						};
						res.statusCode = 500;
					}

					res.setHeader("Content-Type", "text/html");
					output = output.replace(
						"<!-- rakkas-data-placeholder -->",
						content.data,
					);
					output = output.replace(
						"<!-- rakkas-app-placeholder -->",
						content.app,
					);

					res.end(output);
				});
			});

			app.listen(3000).on("listening", () => console.log("Listening on 3000"));
		});
}

const template = `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta http-equiv="X-UA-Compatible" content="ie=edge" />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg">
		<link rel="alternate icon" href="/favicon.ico">
		<title>Rakkas App</title>
		<script>__RAKKAS_INITIAL_DATA=<!-- rakkas-data-placeholder --></script>
	</head>
	<body>
		<div id="rakkas-app"><!-- rakkas-app-placeholder --></div>
		<script type="module" src="/src/client.js"></script>
	</body>
</html>`;
