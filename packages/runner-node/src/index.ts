import { createServer } from "http";
import fs from "fs";
import sirv from "sirv";
import { handleRequest } from "rakkasjs/server";
import { parseBody } from "./parse-body";
import nodeFetch, {
	Response as NodeFetchResponse,
	Request as NodeFetchRequest,
	Headers as NodeFetchHeaders,
} from "node-fetch";

(globalThis.fetch as any) = nodeFetch;
(globalThis.Response as any) = NodeFetchResponse;
(globalThis.Request as any) = NodeFetchRequest;
(globalThis.Headers as any) = NodeFetchHeaders;

export async function startServer() {
	const template = await fs.promises.readFile(
		"./dist/client/index.html",
		"utf-8",
	);

	const fileServer = sirv("dist/client", { etag: true, maxAge: 0 });

	const app = createServer((req, res) => {
		async function handle() {
			try {
				const response = await handleRequest(
					{
						// TODO: Get real host and port
						url: new URL(req.url || "/", `http://${req.headers.host}`),
						method: req.method || "GET",
						headers: new Headers(req.headers as Record<string, string>),
						body: await parseBody(req),
					},
					template,
				);

				res.statusCode = response.status ?? 200;
				Object.entries(response.headers ?? {}).forEach(([k, v]) =>
					res.setHeader(k, v),
				);

				const body =
					typeof response.body === "string"
						? response.body
						: JSON.stringify(response.body);

				res.end(body);
			} catch (error) {
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

	const host = process.env.HOST || "0.0.0.0";
	const port = process.env.PORT || 3000;

	app.listen({ port, host }, () => {
		console.log(`Listening on ${host}:${port}`);
	});
}

startServer();
