import { Context } from "@hattip/core";
import { RequestContext } from "../lib";
import { renderPageRoute } from "./render-page-route";
import { renderApiRoute } from "./render-api-route";

export async function hattipHandler(
	req: Request,
	ctx: Context,
): Promise<Response | undefined> {
	(ctx as any).url = new URL(req.url);

	const pageResponse = await renderPageRoute(req, ctx as RequestContext);
	if (pageResponse) return pageResponse;

	const apiResponse = await renderApiRoute(req, ctx as RequestContext);
	if (apiResponse) return apiResponse;
}
