/* eslint-disable import/no-unresolved */
import { createServer } from "http";
import sirv from "sirv";
import { installNodeFetch } from "./install-node-fetch";
import { handleNodeRequest } from "./handle-node-request";
import {
	apiRoutes,
	pageRoutes,
	manifest,
	htmlTemplate,
	htmlPlaceholder,
} from "./manifests";
import type { handleRequest as HandleRequest } from "rakkasjs/dist/server";

// @ts-expect-error: No typings
import * as server from "$output/server.js";

async function startServer() {
	installNodeFetch();

	const fileServer =
		process.env.DISABLE_STATIC_SERVER === "1"
			? undefined
			: sirv("dist/client", { etag: true, maxAge: 0 });

	const trustForwardedOrigin =
		process.env.TRUST_FORWARDED_ORIGIN === "1" || false;
	const host = process.env.HOST || "localhost";
	const port = process.env.PORT || 3000;

	const app = createServer(async (req, res) => {
		const handleRequest = server.handleRequest as typeof HandleRequest;

		async function handle() {
			await handleNodeRequest({
				htmlTemplate,
				htmlPlaceholder,

				apiRoutes,
				pageRoutes,

				manifest,

				req,
				res,

				trustForwardedOrigin,

				handleRequest,
			}).catch((error) => {
				// TODO: logging
				// eslint-disable-next-line no-console
				console.error(error);
				res.statusCode = 500;
				res.end("Server error");
			});
		}

		if (req.url === "/" || !fileServer) {
			handle();
		} else {
			fileServer(req, res, handle);
		}
	});

	app.listen({ port, host }, () => {
		if (process.argv.every((x) => x !== "-q" && x !== "--quiet")) {
			// TODO: logging
			// eslint-disable-next-line no-console
			console.log(`Rakkas app listening on http://${host}:${port}`);
		}
	});
}

startServer();
