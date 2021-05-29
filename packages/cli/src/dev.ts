import { Command } from "commander";
import { createServer as createViteServer } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { createServer } from "http";
import { encode } from "html-entities";

export default function devCommand() {
	return new Command("dev")
		.description("Start a development server")
		.action(async () => {
			const vite = await createViteServer({
				server: {
					middlewareMode: true,
				},
				plugins: [reactRefresh()],
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
							headers: new Headers(req.headers as Record<string, string>),
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
