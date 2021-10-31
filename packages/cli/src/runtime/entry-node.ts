import { createServer } from "http";
import sirv from "sirv";
import { installNodeFetch } from "./install-node-fetch";
import { handleNodeRequest } from "./handle-node-request";
import { apiRoutes, pageRoutes, manifest, htmlTemplate } from "./manifests";

async function startServer() {
	installNodeFetch();

	const fileServer = sirv("dist/client", { etag: true, maxAge: 0 });

	const trustForwardedOrigin = !!process.env.TRUST_FORWARDED_ORIGIN || false;
	const host = process.env.HOST || "localhost";
	const port = process.env.PORT || 3000;

	const app = createServer((req, res) => {
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

		async function handle() {
			await handleNodeRequest({
				htmlTemplate,

				apiRoutes,
				pageRoutes,

				manifest,

				proto,
				host,
				ip,

				req,
				res,
			}).catch((error) => {
				// TODO: logging
				// eslint-disable-next-line no-console
				console.error(error);
				res.statusCode = 500;
				res.end("Server error");
			});
		}

		if (req.url === "/") {
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
