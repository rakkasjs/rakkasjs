import { PageContext } from "../lib";
import {
	PageRouteGuard,
	PageRouteGuardContext,
	Redirection,
} from "../runtime/page-types";

export function findPage<
	T extends
		| typeof import("virtual:rakkasjs:server-page-routes").default[0]
		| typeof import("virtual:rakkasjs:client-page-routes").default[0],
>(
	routes: T[],
	path: string,
	pageContext: PageContext,
): RouteMatch<T> | Redirection | undefined;

export function findPage<
	T extends
		| typeof import("virtual:rakkasjs:server-page-routes").default[0]
		| typeof import("virtual:rakkasjs:client-page-routes").default[0],
>(routes: T[], path: string): RouteMatch<T> | undefined;

export function findPage<
	T extends
		| typeof import("virtual:rakkasjs:server-page-routes").default[0]
		| typeof import("virtual:rakkasjs:client-page-routes").default[0],
>(
	routes: T[],
	path: string,
	pageContext?: PageContext,
): RouteMatch<T> | Redirection | undefined {
	let originalHref = pageContext?.url.href;
	let rewritten: boolean;

	do {
		rewritten = false;

		outer: for (const route of routes) {
			const re = route[0];
			const match = path.match(re);
			if (!match) continue;

			const params = unescapeParams(match.groups || {}, route[3]);

			if (pageContext) {
				const guards = (route[2] as Array<PageRouteGuard>) || [];
				const guardContext: PageRouteGuardContext = {
					...pageContext,
					params,
				};

				for (const guard of guards) {
					const result = guard(guardContext);
					if (!result) {
						// Try next match
						continue outer;
					} else if (result === true) {
						// Continue with the next guard
						continue;
					} else if ("rewrite" in result) {
						rewritten = true;
						pageContext.url = new URL(result.rewrite, originalHref);
						originalHref = pageContext.url.href;
						path = pageContext.url.pathname;
						// Try again with the new path
						break outer;
					} else {
						return result;
					}
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
