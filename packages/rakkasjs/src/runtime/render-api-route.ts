import { Handler } from "@hattip/core";
import { RequestContext } from "../lib";

export async function renderApiRoute(
	req: Request,
	ctx: RequestContext<Record<string, string>>,
) {
	ctx.locals = {};

	const apiRoutes = await import("virtual:rakkasjs:api-routes");

	for (const [regex, importers] of apiRoutes.default) {
		const match = regex.exec(ctx.url.pathname);
		if (!match) continue;

		ctx.params = match.groups || {};

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
		const handler = endpoint[method] || endpoint.all;

		const response = await handler?.(req, ctx);
		if (response) return response;
	}
}
