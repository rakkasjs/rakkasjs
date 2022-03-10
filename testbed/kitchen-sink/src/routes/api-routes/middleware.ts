import { RequestContext } from "rakkasjs";

export default function (req: Request, ctx: RequestContext) {
	if (ctx.url.searchParams.get("abort") === "1") {
		return new Response("Hello from middleware");
	}
}
