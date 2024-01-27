import { LookupHookResult, PageRouteGuardContext } from "rakkasjs";

export function pageGuard({ url }: PageRouteGuardContext): LookupHookResult {
	return url.searchParams.has("allow-outer");
}
