import { Context, Handler } from "@hattip/core";

export async function hattipHandler(
	req: Request,
	ctx: Context,
): Promise<Response | undefined> {
	const apiRoutes = await import("virtual:rakkasjs:api-routes");

	const url = new URL(req.url);

	for (const [regex, importers] of apiRoutes.default) {
		const match = regex.exec(url.pathname);

		if (!match) continue;

		const [endpointImporter, ...middlewareImporters] = importers;

		for (const middlewareImporter of middlewareImporters) {
			const middleware = await middlewareImporter();
			const response = await middleware.default(req, ctx);
			if (response) return response;
		}

		let endpoint: Record<string, Handler> = (await endpointImporter()) as any;
		if (endpoint.default) endpoint = endpoint.default as any;

		let method = req.method.toLowerCase();
		if (method === "delete") method = "del";
		const handler = endpoint[method];
		const response = await handler?.(req, ctx);
		if (response) return response;
	}
}
