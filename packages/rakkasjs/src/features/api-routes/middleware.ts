import { compose, Handler } from "@hattip/core";
import { RequestContext } from "../../lib";

export default async function renderApiRoute(
	req: Request,
	ctx: RequestContext<Record<string, string>>,
) {
	const apiRoutes = await import("virtual:rakkasjs:api-routes");

	for (const [regex, importers] of apiRoutes.default) {
		const match = regex.exec(ctx.url.pathname);
		if (!match) continue;

		ctx.params = match.groups || {};

		const [endpointImporter, ...middlewareImporters] = importers;

		let endpoint: Record<string, Handler> = (await endpointImporter()) as any;
		if (endpoint.default) endpoint = endpoint.default as any;

		let method = req.method.toLowerCase();
		if (method === "delete") method = "del";
		const endpointHandler = endpoint[method] || endpoint.all;

		if (!endpointHandler) return null;

		const middlewares = await Promise.all(
			middlewareImporters.map((importer) =>
				importer().then((module) => module.default),
			),
		);

		const handler = compose(...middlewares, endpointHandler, ctx.next);

		return handler(req, ctx);
	}
}
