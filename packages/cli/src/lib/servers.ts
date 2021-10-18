import { createServer as createViteServer, ViteDevServer } from "vite";
import { createServer as createHttpServer } from "http";
import { makeViteConfig } from "../lib/vite-config";
import { encode } from "html-entities";
import { parseBody } from "@rakkasjs/runner-node/parse-body";
import { RakkasResponse } from "rakkasjs";
import { htmlTemplate } from "../lib/html-template";
import { FullConfig } from "../..";
import chalk from "chalk";

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
	let vite: ViteDevServer;

	const http = createHttpServer({}, async (req, res) => {
		const url = req.url || "/";

		if (!vite) {
			vite = await createViteServer(
				await makeViteConfig(config, { configDeps, onConfigChange: onReload }),
			);
		}

		vite.middlewares(req, res, async () => {
			let html = htmlTemplate;
			function logResponse() {
				const statusType = Math.floor(res.statusCode / 100);

				const statusColorMap: Record<number, chalk.Chalk | undefined> = {
					2: chalk.green,
					3: chalk.blue,
					4: chalk.yellow,
					5: chalk.redBright,
				};

				const statusColor = statusColorMap[statusType] || chalk.magenta;

				const methodColorMap: Record<string, chalk.Chalk | undefined> = {
					GET: chalk.white,
					HEAD: chalk.gray,
					POST: chalk.green,
					PUT: chalk.yellowBright,
					DELETE: chalk.red,
					CONNECT: chalk.blue,
					OPTIONS: chalk.magentaBright,
					TRACE: chalk.blueBright,
					PATCH: chalk.yellow,
				};

				const methodColor = methodColorMap[req.method || ""] || chalk.magenta;

				// eslint-disable-next-line no-console
				console.log(
					statusColor(res.statusCode),
					methodColor((req.method || "").padEnd(8)),
					req.url,
				);
			}

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
						url: new URL(url, `${proto}://${host}`),
						ip: req.socket.remoteAddress,
						method: req.method || "GET",
						headers: new Headers(req.headers as Record<string, string>),
						type,
						body,
						originalIp: req.socket.remoteAddress,
						originalUrl: new URL(url, `${proto}://${host}`),
					},
					template: html,
				});

				res.statusCode = response.status ?? 200;

				logResponse();

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
			} catch (error: any) {
				vite.ssrFixStacktrace(error);
				// eslint-disable-next-line no-console
				console.error(error.stack ?? "Unknown error");

				res.setHeader("content-type", "text/html");
				res.statusCode = error.status || 500;

				logResponse();

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

	http.on("close", async () => {
		await vite.ws.close();
		await vite.close();
	});

	return { http, config };
}
