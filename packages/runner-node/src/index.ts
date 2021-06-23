#!/usr/bin/env node
import { createServer } from "http";
import fs from "fs";
import path from "path";
import sirv from "sirv";
import { parseBody } from "./parse-body.js";
import nodeFetch, {
	Response as NodeFetchResponse,
	Request as NodeFetchRequest,
	Headers as NodeFetchHeaders,
} from "node-fetch";
import { pathToFileURL } from "url";

(globalThis as any).fetch = nodeFetch;
(globalThis as any).Response = NodeFetchResponse;
(globalThis as any).Request = NodeFetchRequest;
(globalThis as any).Headers = NodeFetchHeaders;

export async function startServer() {
	const rootDir = process.cwd();

	const apiRoutes = (
		await import(
			pathToFileURL(path.resolve(rootDir, "./dist/server/api-routes.js")).href
		)
	).default.default;

	const pageRoutes = (
		await import(
			pathToFileURL(path.resolve(rootDir, "./dist/server/page-routes.js")).href
		)
	).default.default;

	const { handleRequest } = (await import(
		pathToFileURL(path.resolve(rootDir, "./dist/server/server.js")).href
	)) as any;

	const manifest: Record<string, string[]> = JSON.parse(
		await fs.promises.readFile("./dist/rakkas-manifest.json", "utf-8"),
	);

	const template = await fs.promises.readFile("./dist/index.html", "utf-8");

	const fileServer = sirv("dist/client", { etag: true, maxAge: 0 });

	const app = createServer((req, res) => {
		async function handle() {
			try {
				const response = await handleRequest(apiRoutes, pageRoutes, {
					request: {
						// TODO: Get real host and port
						url: new URL(req.url || "/", `http://${req.headers.host}`),
						method: req.method || "GET",
						headers: new Headers(req.headers as Record<string, string>),
						body: await parseBody(req),
					},
					template,
					manifest,
					pages: pageRoutes,
				});

				res.statusCode = response.status ?? 200;
				Object.entries(
					(response.headers as Record<string, string>) ?? {},
				).forEach(([k, v]) => res.setHeader(k, v));

				const body =
					typeof response.body === "string"
						? response.body
						: JSON.stringify(response.body);

				res.end(body);
			} catch (error) {
				console.error(error);
				res.statusCode = 500;
				res.end("Server error");
			}
		}

		if (req.url === "/") {
			handle();
		} else {
			fileServer(req, res, handle);
		}
	});

	const host = process.env.HOST || "localhost";
	const port = process.env.PORT || 3000;

	app.listen({ port, host }, () => {
		console.log(`Listening on ${host}:${port}`);
	});
}

startServer();
