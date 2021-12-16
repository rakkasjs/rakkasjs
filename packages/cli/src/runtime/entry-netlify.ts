import { installNodeFetch } from "./install-node-fetch";
import {
	apiRoutes,
	pageRoutes,
	manifest,
	htmlTemplate,
	htmlPlaceholder,
} from "./manifests";

import type { handleRequest as HandleRequest } from "rakkasjs/dist/server";
import type { NetlifyFunction } from "netlify-lambda-types";
import type { RakkasRequestBodyAndType } from "rakkasjs";

installNodeFetch();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const handleRequest = require("$output/server.js")
	.handleRequest as typeof HandleRequest;

export const handler: NetlifyFunction = async (event) => {
	const url = new URL(event.path, "https://" + event.headers.host);

	const encoding = event.isBase64Encoded
		? ("base64" as const)
		: ("utf-8" as const);

	const requestBody = event.body || "";

	const bodyBuffer =
		typeof requestBody === "string"
			? Buffer.from(requestBody, encoding)
			: requestBody;

	const headers = new Headers(event.headers);

	const response = await handleRequest({
		htmlTemplate,
		htmlPlaceholder,

		apiRoutes,
		pageRoutes,

		manifest,

		request: {
			url,
			ip: event.headers["client-ip"],
			method: event.httpMethod,
			originalIp: event.headers["client-ip"],
			headers,
			originalUrl: url,
			...parseBody(bodyBuffer, headers),
		},
	});

	let body = response.body || "";
	let isBase64Encoded = false;

	if (body instanceof Uint8Array) {
		isBase64Encoded = true;
		body = Buffer.from(body).toString("base64");
	} else if (typeof body !== "string") {
		body = JSON.stringify(body);
	}

	return {
		statusCode: response.status || 200,
		headers: response.headers as Record<string, string>,
		body: body as string,
		isBase64Encoded,
	};
};

function parseBody(
	bodyBuffer: Buffer,
	headers: Headers,
): RakkasRequestBodyAndType {
	if (bodyBuffer.length === 0) {
		return { type: "empty" };
	}

	const [type, ...directives] = (headers.get("content-type") || "").split(";");
	const isJson = type === "application/json" || type.endsWith("+json");
	const isUrlEncoded = type === "application/x-www-form-urlencoded";

	if (type.startsWith("text/") || isJson || isUrlEncoded) {
		const dirs = Object.fromEntries(
			directives.map((dir) => dir.split("=").map((x) => x.trim())),
		);

		let text: string;
		try {
			text = bodyBuffer.toString(dirs.charset || "utf-8");
		} catch (error) {
			(error as any).status = 400;
			throw error;
		}

		if (isJson) {
			try {
				return { type: "json", body: JSON.parse(text) };
			} catch (error) {
				(error as any).status = 400;
				throw error;
			}
		} else if (isUrlEncoded) {
			return {
				type: "form-data",
				body: new URLSearchParams(text),
			};
		}

		return { type: "text", body: text };
	}

	return { type: "binary", body: new Uint8Array(bodyBuffer) };
}
