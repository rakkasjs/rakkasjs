import { renderPageRoute } from "./render-page-route";
import { renderApiRoute } from "./render-api-route";

export async function hattipHandler(
	req: Request,
	ctx: any,
): Promise<Response | undefined> {
	ctx.url = new URL(req.url);
	ctx.locals = {};

	const handlers = [renderPageRoute, renderApiRoute];

	for (const handler of handlers) {
		const response = await handler(req, ctx);
		if (response) return response;
	}
}
