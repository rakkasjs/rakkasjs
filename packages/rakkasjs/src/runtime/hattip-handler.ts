import { Context } from "@hattip/core";
import { RequestContext } from "../lib";
import { renderApiRoute } from "./render-api-route";

export async function hattipHandler(
	req: Request,
	ctx: Context,
): Promise<Response | undefined> {
	const apiResponse = await renderApiRoute(req, ctx as RequestContext);
	if (apiResponse) return apiResponse;
}
