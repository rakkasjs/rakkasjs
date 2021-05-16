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
			const clientCode = await fs.readFile(
				path.resolve(__dirname, "../runtime/client.tsx"),
				{ encoding: "utf-8" },
			);

			const serverCode = await fs.readFile(
				path.resolve(__dirname, "../runtime/server.tsx"),
				{ encoding: "utf-8" },
			);

			const routesCode = await fs.readFile(
				path.resolve(__dirname, "../runtime/routes.tsx"),
				{ encoding: "utf-8" },
			);

			// Create vite server in middleware mode. This disables Vite's own HTML
			// serving logic and let the parent server take control.
			let viteServer: ViteDevServer;

			const vite = await createViteServer({
				server: { middlewareMode: true },
				plugins: [
					reactRefresh(),
					{
						name: "rakkas",
						enforce: "pre",
						configureServer(server) {
							viteServer = server;
						},
						resolveId(src) {
							if (
								src === "@rakkasjs:client.tsx" ||
								src === "/@rakkasjs:client.tsx" ||
								src === "@rakkasjs:server.tsx" ||
								src === "@rakkasjs:routes.tsx" ||
								src === "@rakkasjs:pages" ||
								src === "@rakkasjs:layouts"
							) {
								return src;
							}
						},
						load(id, ssr) {
							if (
								id === "@rakkasjs:client.tsx" ||
								id === "/@rakkasjs:client.tsx"
							) {
								return {
									code: clientCode,
								};
							} else if (id === "@rakkasjs:server.tsx") {
								return { code: serverCode };
							} else if (id === "@rakkasjs:routes.tsx") {
								return { code: routesCode };
							} else if (id === "@rakkasjs:pages") {
								return glob("./src/pages/**/*.page.[jt]sx").then((paths) => {
									return {
										code: `export default [${paths.map(
											(path) =>
												"[" +
												JSON.stringify(path.slice(12)) +
												`, () => import(${JSON.stringify(path)})]`,
										)}]`,
									};
								});
							} else if (id === "@rakkasjs:layouts") {
								return glob("./src/pages/**/*.layout.[jt]sx").then((paths) => {
									return {
										code: `export default [${paths.map(
											(path) =>
												"[" +
												JSON.stringify(path.slice(12)) +
												`, () => import(${JSON.stringify(path)})]`,
										)}]`,
									};
								});
							}
						},
					},
				],
				resolve: {
					alias: {
						"$app": "",
					},
				},
			});

			const app = createServer({}, (req, res) => {
				const url = req.url;
				vite.middlewares(req, res, async () => {
					let output = template;
					let content: string;

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
						content = encode(error.stack ?? "Unknwon error");
						res.statusCode = 500;
					}

					res.setHeader("Content-Type", "text/html");
					output = output.replace("<!-- rakkas-app-placeholder -->", content);
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
	</head>
	<body>
		<div id="rakkas-app"><!-- rakkas-app-placeholder --></div>
		<script type="module" src="@rakkasjs:client.tsx"></script>
	</body>
</html>`;
