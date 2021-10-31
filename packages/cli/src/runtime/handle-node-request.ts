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

	req: IncomingMessage;
	res: ServerResponse;

	trustForwardedOrigin: boolean;

	writeFile?(name: string, content: string): Promise<void>;
	handleRequest: typeof HandleRequest;
}

export async function handleNodeRequest({
	htmlTemplate,

	apiRoutes,
	pageRoutes,

	manifest,

	req,
	res,

	trustForwardedOrigin,

	writeFile,
	handleRequest,
}: NodeRequestContext) {
	const { body, type } = await parseNodeRequestBody(req);
	const proto =
		(trustForwardedOrigin && (req.headers["x-forwarded-proto"] as string)) ||
		"http";
	const host =
		(trustForwardedOrigin && (req.headers["x-forwarded-host"] as string)) ||
		req.headers.host ||
		"localhost";
	const ip =
		(trustForwardedOrigin && (req.headers["x-forwarded-for"] as string)) ||
		req.socket.remoteAddress ||
		"";

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
		writeFile,
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
