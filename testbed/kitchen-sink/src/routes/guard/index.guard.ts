import { PageContext } from "rakkasjs";

export default function guard(ctx: PageContext) {
	if (ctx.url.searchParams.has("rewrite")) {
		ctx.url.pathname = "/guard/rewritten";
		return false;
	}

	return ctx.url.searchParams.has("allow-inner");
}
