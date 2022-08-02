import { LookupHookResult, PageContext } from "rakkasjs";

export function pageGuard(ctx: PageContext): LookupHookResult {
	return ctx.url.searchParams.has("allow-outer");
}
