import { PageContext } from "../lib";
import { PageRouteGuard, PageRouteGuardContext } from "../runtime/page-types";

export function findRoute<
	T extends
		| typeof import("virtual:rakkasjs:server-page-routes").default[0]
		| typeof import("virtual:rakkasjs:client-page-routes").default[0],
>(
	routes: T[],
	path: string,
	pageContext?: PageContext,
): RouteMatch<T> | undefined {
	let originalHref = pageContext?.url.href;
	let rewritten: boolean;

	do {
		rewritten = false;
		for (const route of routes) {
			const re = route[0];
			const match = path.match(re);
			if (!match) continue;
			const params = unescapeParams(match.groups || {}, route[3]);

			if (pageContext) {
				const guards = (route[2] as Array<PageRouteGuard>) || [];
				let guarded = false;
				const guardContext: PageRouteGuardContext = {
					...pageContext,
					params,
				};

				for (const guard of guards) {
					if (!guard(guardContext)) {
						guarded = true;
						break;
					}
				}

				if (guarded) {
					if (pageContext.url.href !== originalHref) {
						originalHref = pageContext.url.href;
						path = pageContext.url.pathname;
						rewritten = true;
						break;
					}
					continue;
				}
			}

			return {
				route,
				params,
			};
		}
	} while (rewritten);
}

export interface RouteMatch<T> {
	route: T;
	params: Record<string, string>;
}

export function unescapeParams(params: Record<string, string>, rest?: string) {
	for (const [key, value] of Object.entries(params)) {
		if (key === rest) continue;
		params[key] = decodeURIComponent(value);
	}
	return params;
}
