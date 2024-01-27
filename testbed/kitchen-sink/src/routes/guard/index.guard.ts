import { LookupHookResult, PageRouteGuardContext } from "rakkasjs";

export function pageGuard({ url }: PageRouteGuardContext): LookupHookResult {
	if (url.searchParams.has("rewrite")) {
		return { rewrite: "/guard/rewritten?allow-outer" };
	}

	if (url.searchParams.has("redirect")) {
		return { redirect: "/guard/redirected?allow-outer" };
	}

	return url.searchParams.has("allow-inner");
}
