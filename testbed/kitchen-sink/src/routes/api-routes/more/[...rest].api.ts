import { RequestContext } from "rakkasjs";

export function get(req: Request, ctx: RequestContext) {
	return new Response("Rest: " + JSON.stringify(ctx.params));
}
