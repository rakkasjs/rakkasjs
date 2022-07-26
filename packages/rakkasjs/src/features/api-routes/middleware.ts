import {
	composePartial,
	RequestHandler,
	RequestContext,
} from "@hattip/compose";
import { unescapeParams } from "../../internal/find-route";

export default async function renderApiRoute(ctx: RequestContext) {
	const apiRoutes = await import("virtual:rakkasjs:api-routes");

	for (const [regex, importers, rest] of apiRoutes.default) {
		const match = regex.exec(ctx.url.pathname);
		if (!match) continue;

		ctx.params = unescapeParams(match.groups || {}, rest);

		const [endpointImporter, ...middlewareImporters] = importers;

		let endpoint: Record<string, RequestHandler> =
			(await endpointImporter()) as any;
		if (endpoint.default) endpoint = endpoint.default as any;

		let method = ctx.method.toLowerCase();
		if (method === "delete") method = "del";
		const endpointHandler = endpoint[method] || endpoint.all;

		if (!endpointHandler) return;

		const middlewares = await Promise.all(
			middlewareImporters.map((importer) =>
				importer().then((module) => module.default),
			),
		);

		const handler = composePartial([...middlewares, endpointHandler], ctx.next);

		return handler(ctx);
	}
}
