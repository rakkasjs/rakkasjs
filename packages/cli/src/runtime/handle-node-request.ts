import type { IncomingMessage, ServerResponse } from "http";
import type { RakkasResponse } from "rakkasjs";
import type {
	Route,
	handleRequest as HandleRequest,
} from "rakkasjs/dist/server";
import { parseNodeRequestBody } from "./parse-node-request-body";

export interface NodeRequestContext {
	htmlTemplate: string;

	apiRoutes: Route[];
	pageRoutes: Route[];

	manifest?: Record<string, string[] | undefined>;

	proto: string;
	host: string;
	ip: string;

	req: IncomingMessage;
	res: ServerResponse;
}

const SERVER = "./server.js";

export async function handleNodeRequest({
	htmlTemplate,

	apiRoutes,
	pageRoutes,

	manifest,

	proto,
	host,
	ip,

	req,
	res,
}: NodeRequestContext) {
	const { body, type } = await parseNodeRequestBody(req);

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { handleRequest } = require(SERVER) as {
		handleRequest: typeof HandleRequest;
	};

	const response: RakkasResponse = await handleRequest({
		apiRoutes,
		pageRoutes,
		htmlTemplate,
		manifest,
		request: {
			ip,
			url: new URL(req.url || "/", `${proto}://${host}`),
			method: req.method || "GET",
			headers: new Headers(req.headers as Record<string, string>),
			type,
			body,
			originalIp: req.socket.remoteAddress!,
			originalUrl: new URL(
				req.url || "/",
				`http://${req.headers.host || "localhost"}`,
			),
		},
	});

	res.statusCode = response.status ?? 200;

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
}
