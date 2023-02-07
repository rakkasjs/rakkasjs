import { Session } from "@auth/core/types";
import { LookupHookResult, PageContext } from "rakkasjs";

export function pageGuard(ctx: PageContext): LookupHookResult {
	const session: Session = ctx.queryClient.getQueryData("auth:session");

	if (session.user) {
		return true;
	} else {
		const url = new URL("/auth/signin", ctx.url);
		url.searchParams.set("callbackUrl", ctx.url.pathname + ctx.url.search);
		return { redirect: url };
	}
}
