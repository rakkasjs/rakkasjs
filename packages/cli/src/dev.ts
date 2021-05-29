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
			const generatedFiles = ["pages", "layouts", "endpoints"];

			const vite = await createViteServer({
				server: {
					middlewareMode: true,
				},
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
									} else if (
										fileName.match(/^((.+)[\./])?endpoint\.[a-zA-Z0-9]+$/)
									) {
										const mdl = viteServer.moduleGraph.getModuleById(
											"@rakkasjs:endpoints",
										);
										if (mdl) {
											viteServer.watcher.emit("change", "@rakkasjs:endpoints");
										}
									}
								}
							});
						},

						resolveId(src) {
							if (src.startsWith("@rakkasjs:")) {
								const filename = src.slice(src.indexOf(":") + 1);
								if (generatedFiles.includes(filename)) {
									return `@rakkasjs:${filename}`;
								}
							}
						},

						async load(id) {
							if (id === "@rakkasjs:pages") {
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
							} else if (id === "@rakkasjs:endpoints") {
								return glob("./src/pages/**/(*.)?endpoint.[[:alnum:]]+").then(
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
						type: string;
						data: string;
						app: string;
					};

					try {
						const { handleRequest } = await vite.ssrLoadModule(
							"$rakkas/server",
						);

						output = await vite.transformIndexHtml(url, output);
						const response = await handleRequest({
							// TODO: Get real host and port
							url: new URL(url, `http://${req.headers.host}`),
							method: req.method,
							headers: new Headers(req.headers as any),
						});

						if (response.type === "page") {
							content = response;
							res.statusCode = 200;
						} else if (response.type === "endpoint") {
							res.statusCode = response.status ?? 200;
							Object.entries(
								response.headers as Record<string, string>,
							).forEach(([k, v]) => res.setHeader(k, v));

							res.end(JSON.stringify(response.body ?? {}));
						}
					} catch (error) {
						vite.ssrFixStacktrace(error);
						content = {
							type: "page",
							data: "[]",
							app: encode(error.stack ?? "Unknwon error"),
						};
						res.statusCode = 500;
					}

					if (content.type === "page") {
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
					}
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
		<script type="module" src="/src/client"></script>
	</body>
</html>`;
