import { createMiddleware } from "rakkasjs/node-adapter";
import hattipHandler from "./entry-hattip";
import Fastify from "fastify";
import type { IncomingMessage, ServerResponse } from "node:http";

const app = Fastify({ logger: true });

// You can use Fastify routes and plugins here
app.get("/fastify", (_request, _reply) => {
	return { message: "Hello from Fastify!" };
});

const rakkasHandler = createMiddleware(hattipHandler);

// This should be the last route
app.all("*", {
	onRequest(request, reply) {
		return rakkasHandler(request.raw, reply.raw);
	},
	handler() {
		throw new Error("This should never be called");
	},
});

let appReadyPromise: PromiseLike<void> | undefined = app.ready();

export default async function handler(
	req: IncomingMessage,
	res: ServerResponse,
) {
	if (appReadyPromise) {
		await appReadyPromise;
		appReadyPromise = undefined;
	}

	app.server.emit("request", req, res);
}
