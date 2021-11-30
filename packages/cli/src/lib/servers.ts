import { createServer as createViteServer, ViteDevServer } from "vite";
import { createServer as createHttpServer } from "http";
import { makeViteConfig } from "../lib/vite-config";
import { encode } from "html-entities";
import { htmlTemplate } from "../lib/html-template";
import { FullConfig } from "../..";
import chalk from "chalk";
import path from "path";

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
		const viteConfig = await makeViteConfig(config, "node", {
			configDeps,
			onConfigChange: onReload,
		});

		if (!vite) {
			vite = await createViteServer({ ...viteConfig });
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
				const { handleRequest } = await vite.ssrLoadModule("rakkasjs/server");
				const pageRoutes = (await vite.ssrLoadModule("@rakkasjs/page-routes"))
					.default;
				const apiRoutes = (await vite.ssrLoadModule("@rakkasjs/api-routes"))
					.default;

				const all = (await vite.ssrLoadModule(
					path.resolve(__dirname, "entries/handle-node-request.js"),
				)) as typeof import("../runtime/handle-node-request");

				const { handleNodeRequest } = all;

				html = await vite.transformIndexHtml(url, html);

				await handleNodeRequest({
					pageRoutes,
					apiRoutes,
					htmlTemplate: html,
					req,
					res,
					handleRequest,
					trustForwardedOrigin: config.trustForwardedOrigin,
				});

				// TODO: Logging
				logResponse();
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
