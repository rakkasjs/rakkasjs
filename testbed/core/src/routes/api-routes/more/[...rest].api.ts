import { RequestContext } from "rakkasjs";

export function GET(ctx: RequestContext) {
	return new Response(JSON.stringify(ctx.params));
}
