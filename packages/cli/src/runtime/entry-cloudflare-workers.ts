import { apiRoutes, pageRoutes, manifest, htmlTemplate } from "./manifests";
import { getAssetFromKV, NotFoundError } from "@cloudflare/kv-asset-handler";

import type { handleRequest as HandleRequest } from "rakkasjs/dist/server";
import type { RakkasRequestBodyAndType } from "rakkasjs";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const handleRequest = require("$output/server.js")
	.handleRequest as typeof HandleRequest;

addEventListener("fetch", async (event: FetchEvent) => {
	event.respondWith(handler(event));
});

async function handler(event: FetchEvent) {
	if (event.request.method === "GET") {
		try {
			return await getAssetFromKV(event);
		} catch (error) {
			if (!(error instanceof NotFoundError)) {
				return new Response("Server error", { status: 500 });
			}
		}
	}

	try {
		const url = new URL(event.request.url);
		const headers = event.request.headers;

		const response = await handleRequest({
			htmlTemplate,

			apiRoutes,
			pageRoutes,

			manifest,

			request: {
				url,
				ip: headers.get("CF-Connecting-IP") || "",
				method: event.request.method,
				originalIp: headers.get("CF-Connecting-IP") || "",
				headers,
				originalUrl: url,
				...parseBody(
					new Uint8Array(await event.request.arrayBuffer()),
					headers,
				),
			},
		});

		let body = response.body || "";

		if (typeof body !== "string" && !(body instanceof Uint8Array)) {
			body = JSON.stringify(body);
		}

		return new Response(body as any, {
			status: response.status,
			headers: response.headers as Record<string, string>,
		});
	} catch (error) {
		return new Response("Server error", { status: 500 });
	}
}

function parseBody(
	bodyBuffer: Uint8Array | null | undefined,
	headers: Headers,
): RakkasRequestBodyAndType {
	if (!bodyBuffer || bodyBuffer.length === 0) {
		return { type: "empty" };
	}

	const [type /* ...directives */] = (headers.get("content-type") || "").split(
		";",
	);
	const isJson = type === "application/json" || type.endsWith("+json");
	const isUrlEncoded = type === "application/x-www-form-urlencoded";

	if (type.startsWith("text/") || isJson || isUrlEncoded) {
		// const dirs = Object.fromEntries(
		// 	directives.map((dir) => dir.split("=").map((x) => x.trim())),
		// );

		let text: string;
		try {
			text = new TextDecoder("utf8").decode(bodyBuffer);
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
