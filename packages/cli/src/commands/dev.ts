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
import { RakkasResponse } from "rakkasjs";
import open from "open";

(globalThis as any).fetch = nodeFetch;
(globalThis as any).Response = NodeFetchResponse;
(globalThis as any).Request = NodeFetchRequest;
(globalThis as any).Headers = NodeFetchHeaders;

export default function devCommand() {
	return new Command("dev")
		.option("-p, --port <port>", "development server port number", "3000")
		.option("-H, --host <host>", "development server host", "localhost")
		.option("-o, --open", "open in browser")
		.description("Start a development server")
		.action(startServer);
}

async function startServer(opts: { port: string; host: string; open?: true }) {
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

	http.listen({ port, host }).on("listening", async () => {
		// eslint-disable-next-line no-console
		console.log(`Server listening on http://${host}:${port}`);
		if (opts.open) {
			// eslint-disable-next-line no-console
			console.log("Launching the browser");
			await open(`http://${host}:${port}`);
		}
	});
}

async function createServers(onReload: () => void) {
	const { config, deps: configDeps } = await loadConfig();

	const vite = await createViteServer(
		await makeViteConfig(config, configDeps, onReload),
	);

	const http = createHttpServer({}, (req, res) => {
		const url = req.url || "/";

		vite.middlewares(req, res, async () => {
			let html = template;

			try {
				// Force them into module cache. Otherwise symlinks confuse vite.
				await vite.ssrLoadModule("rakkasjs");
				await vite.ssrLoadModule("rakkasjs/server");

				const { processRequest } = await vite.ssrLoadModule(
					"@rakkasjs/process-request",
				);

				html = await vite.transformIndexHtml(url, html);

				const proto =
					(config.trustForwardedOrigin && req.headers["x-forwarded-proto"]) ||
					"http";
				const host =
					(config.trustForwardedOrigin && req.headers["x-forwarded-host"]) ||
					req.headers.host ||
					"localhost";

				const { body, type } = await parseBody(req);

				const response: RakkasResponse = await processRequest({
					request: {
						// TODO: Get real host and port
						url: new URL(url, `${proto}://${host}`),
						method: req.method || "GET",
						headers: new Headers(req.headers as Record<string, string>),
						type,
						body,
					},
					template: html,
				});

				res.statusCode = response.status ?? 200;
				// eslint-disable-next-line no-console
				console.log(res.statusCode, req.method, req.url);

				let headers = response.headers;
				if (!headers) headers = [];
				if (!Array.isArray(headers)) headers = Object.entries(headers);

				headers.forEach(([name, value]) => {
					if (value === undefined) return;
					res.setHeader(name, value);
				});

				if (
					response.body === null ||
					response.body === undefined ||
					response.body instanceof Uint8Array ||
					typeof response.body === "string"
				) {
					res.end(response.body);
				} else {
					res.end(JSON.stringify(response.body));
				}
			} catch (error) {
				vite.ssrFixStacktrace(error);
				// eslint-disable-next-line no-console
				console.error(error.stack ?? "Unknown error");

				res.setHeader("content-type", "text/html");
				res.statusCode = error.status || 500;

				// eslint-disable-next-line no-console
				console.log(res.statusCode, req.method, req.url);

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
		<script type="module" src="/__rakkas-start-client.js"></script>
	</body>
</html>`;
