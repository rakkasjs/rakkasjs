import { Command } from "commander";
import { createServer as createViteServer } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { createServer } from "http";
import { parseBody } from "./parse-body";
import type { RawRequest, RakkasResponse } from "@rakkasjs/core";

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
					console.log(req.method, req.url);
					let html = template;

					try {
						const { handleRequest } = (await vite.ssrLoadModule(
							"$rakkas/server",
						)) as {
							handleRequest(
								req: RawRequest,
								template: string,
							): Promise<RakkasResponse>;
						};

						html = await vite.transformIndexHtml(url, html);

						const response = await handleRequest(
							{
								// TODO: Get real host and port
								url: new URL(url, `http://${req.headers.host}`),
								method: req.method,
								headers: new Headers(req.headers as Record<string, string>),
								body: await parseBody(req),
							},
							html,
						);

						res.statusCode = response.status ?? 200;
						Object.entries(
							(response.headers ?? {}) as Record<string, string>,
						).forEach(([k, v]) => res.setHeader(k, v));

						const body =
							typeof response.body === "string"
								? response.body
								: JSON.stringify(response.body);

						res.end(body);
					} catch (error) {
						vite.ssrFixStacktrace(error);
						res.statusCode = 500;
						res.end(error.stack ?? "Unknown error");
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
		<!-- rakkas-head-placeholder -->
	</head>
	<body>
		<div id="rakkas-app"><!-- rakkas-app-placeholder --></div>
		<script type="module" src="/src/client"></script>
	</body>
</html>`;
