import { Session } from "@auth/core/types";
import { LookupHookResult, PageRouteGuardContext } from "rakkasjs";

export function pageGuard(ctx: PageRouteGuardContext): LookupHookResult {
	const session: Session | null = ctx.queryClient.getQueryData("auth:session");

	if (session?.user) {
		return true;
	} else {
		const url = new URL("/auth/signin", ctx.url);
		url.searchParams.set("callbackUrl", url.pathname + url.search);
		return { redirect: url };
	}
}
