import { RequestContext } from "rakkasjs";

export function get(req: Request, ctx: RequestContext) {
	return new Response(JSON.stringify(ctx.params));
}
