import { RequestContext } from "rakkasjs";

export default async function (ctx: RequestContext) {
	if (ctx.url.searchParams.get("abort") === "1") {
		return new Response("Hello from middleware");
	} else if (ctx.url.searchParams.get("modify") === "1") {
		const response = await ctx.next();
		response.headers.set("x-middleware", "1");
		return response;
	}
}
