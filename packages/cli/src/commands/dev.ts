import { Command } from "commander";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import nodeFetch, {
	Response as NodeFetchResponse,
	Request as NodeFetchRequest,
	Headers as NodeFetchHeaders,
} from "node-fetch";
import { makeViteConfig } from "../lib/vite-config";
import { loadConfig } from "../lib/config";
import { encode } from "html-entities";
import { parseBody } from "@rakkasjs/runner-node/parse-body";

(globalThis as any).fetch = nodeFetch;
(globalThis as any).Response = NodeFetchResponse;
(globalThis as any).Request = NodeFetchRequest;
(globalThis as any).Headers = NodeFetchHeaders;

export default function devCommand() {
	return new Command("dev")
		.option("-p, --port <port>", "development server port number", "3000")
		.option("-H, --host <host>", "development server host", "localhost")
		.description("Start a development server")
		.action(startServer);
}

async function startServer(opts: { port: string; host: string }) {
	const port = Number(opts.port);
	if (!Number.isInteger(port)) {
		throw new Error(`Invalid port number ${opts.port}`);
	}

	const host = opts.host;

	async function reload() {
		http.on("close", async () => {
			await vite.ws.close();
			await vite.close();

			const newServers = await createServers(reload);

			vite = newServers.vite;
			http = newServers.http;
			http.listen(3000).on("listening", () => {
				// eslint-disable-next-line no-console
				console.log(`Server restarted`);
			});
		});

		http.close();
	}

	let { vite, http } = await createServers(reload);

	http.listen({ port, host }).on("listening", () => {
		// eslint-disable-next-line no-console
		console.log(`Server listening on http://${host}:${port}`);
	});
}

async function createServers(onReload: () => void) {
	const { config, deps: configDeps } = await loadConfig();

	const vite = await createViteServer(
		makeViteConfig(config, configDeps, onReload),
	);

	const http = createHttpServer({}, (req, res) => {
		const url = req.url || "/";

		vite.middlewares(req, res, async () => {
			// eslint-disable-next-line no-console
			console.log(req.method, req.url);
			let html = template;

			try {
				const { handleRequest } = (await vite.ssrLoadModule(
					"rakkasjs/server",
				)) as typeof import("rakkasjs/server");

				html = await vite.transformIndexHtml(url, html);

				const response = await handleRequest(
					{
						// TODO: Get real host and port
						url: new URL(url, `http://${req.headers.host}`),
						method: req.method || "GET",
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
				// eslint-disable-next-line no-console
				console.error(error.stack ?? "Unknown error");

				res.setHeader("content-type", "text/html");
				res.statusCode = 500;
				res.end(
					template.replace(
						"<!-- rakkas-app-placeholder -->",
						"<pre>A server-side render error has occured:\n\n" +
							encode(error.stack || error.message || "Unknown error") +
							"</pre>",
					),
				);
			}
		});
	});

	return { vite, http, config };
}

const template = `<!DOCTYPE html>
<html><!-- rakkas-html-attributes-placeholder -->
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta http-equiv="X-UA-Compatible" content="ie=edge" />
		<!-- rakkas-head-placeholder -->
	</head>
	<body><!-- rakkas-body-attributes-placeholder -->
		<div id="rakkas-app"><!-- rakkas-app-placeholder --></div>
		<script type="module" src="/client"></script>
	</body>
</html>`;
