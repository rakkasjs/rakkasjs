import { PageContext } from "rakkasjs";

export default function guard(ctx: PageContext) {
	return ctx.url.searchParams.has("allow-inner");
}
