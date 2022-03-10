import { RequestContext } from "rakkasjs";

export function get(req: Request, ctx: RequestContext) {
	return new Response("Fallback: " + JSON.stringify(ctx.params));
}
