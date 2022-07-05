import { PageContext } from "../lib";
import { PageRouteGuard, PageRouteGuardContext } from "../runtime/page-types";

export function findRoute<T extends [RegExp, ...unknown[]]>(
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
			const params = match.groups || {};

			if (pageContext) {
				const guards = route[2] as Array<PageRouteGuard>;
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
