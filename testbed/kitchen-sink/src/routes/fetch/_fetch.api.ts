import { RequestContext } from "rakkasjs";

export async function get(ctx: RequestContext) {
	return new Response(
		JSON.stringify({
			withCredentials: await ctx
				.fetch("/fetch", {
					method: "POST",
					credentials: "include",
				})
				.then((r) => r.text()),
			withoutCredentials: await ctx
				.fetch("/fetch", {
					method: "POST",
					credentials: "omit",
				})
				.then((r) => r.text()),
			withImplicitCredentials: await ctx
				.fetch("/fetch", {
					method: "POST",
				})
				.then((r) => r.text()),
		}),
	);
}

export function post(ctx: RequestContext) {
	return new Response(ctx.request.headers.get("Authorization"));
}
