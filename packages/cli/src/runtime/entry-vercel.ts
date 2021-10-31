import { handleNodeRequest } from "./handle-node-request";
import { installNodeFetch } from "./install-node-fetch";
import { apiRoutes, pageRoutes, manifest, htmlTemplate } from "./manifests";

import type { IncomingMessage, ServerResponse } from "http";
import type { handleRequest as HandleRequest } from "rakkasjs/dist/server";

installNodeFetch();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const handleRequest = require("$output/server.js")
	.handleRequest as typeof HandleRequest;

export default async function vercel(
	req: IncomingMessage,
	res: ServerResponse,
) {
	await handleNodeRequest({
		htmlTemplate,

		apiRoutes,
		pageRoutes,

		manifest,

		req,
		res,

		trustForwardedOrigin: true,

		handleRequest,
	}).catch((error) => {
		// TODO: logging
		// eslint-disable-next-line no-console
		console.error(error);
		res.statusCode = 500;
		res.end("Server error");
	});
}

module.exports = vercel;
