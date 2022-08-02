import { LookupHookResult, PageContext } from "rakkasjs";

export function pageGuard(ctx: PageContext): LookupHookResult {
	if (ctx.url.searchParams.has("rewrite")) {
		return { rewrite: "/guard/rewritten?allow-outer" };
	}

	if (ctx.url.searchParams.has("redirect")) {
		return { redirect: "/guard/redirected?allow-outer" };
	}

	return ctx.url.searchParams.has("allow-inner");
}
