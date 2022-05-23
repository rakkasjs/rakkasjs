import renderApiRoute from "../features/api-routes/middleware";
import renderPageRoute from "../features/pages/middleware";

// TODO: Just export the handlers without composing them
export async function hattipHandler(
	req: Request,
	ctx: any,
): Promise<Response | undefined> {
	// TODO(features): Move these into their own features
	ctx.url = new URL(req.url);
	ctx.locals = {};

	const handlers = [renderApiRoute, renderPageRoute];

	for (const handler of handlers) {
		const response = await handler(req, ctx);
		if (response) return response;
	}
}
