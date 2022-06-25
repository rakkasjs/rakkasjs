import { RequestContext } from "rakkasjs";

export function get(ctx: RequestContext) {
	return new Response(JSON.stringify(ctx.params));
}
