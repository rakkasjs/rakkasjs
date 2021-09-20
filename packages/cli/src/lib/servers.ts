import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { makeViteConfig } from "../lib/vite-config";
import { encode } from "html-entities";
import { parseBody } from "@rakkasjs/runner-node/parse-body";
import { RakkasResponse } from "rakkasjs";
import { htmlTemplate } from "../lib/html-template";
import { FullConfig } from "../..";

export interface ServersConfig {
	config: FullConfig;
	deps?: string[];
	onReload?: () => void;
}

export async function createServers({
	config,
	deps: configDeps,
	onReload,
}: ServersConfig) {
	const vite = await createViteServer(
		await makeViteConfig(config, { configDeps, onConfigChange: onReload }),
	);

	const http = createHttpServer({}, (req, res) => {
		const url = req.url || "/";

		vite.middlewares(req, res, async () => {
			let html = htmlTemplate;

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
					htmlTemplate.replace(
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
