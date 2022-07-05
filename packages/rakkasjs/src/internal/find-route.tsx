import { PageContext } from "../lib";
import { PageRouteGuard } from "../runtime/page-types";

export function findRoute<T extends [RegExp, ...unknown[]]>(
	routes: T[],
	path: string,
	pageContext?: PageContext,
): RouteMatch<T> | undefined {
	for (const route of routes) {
		const re = route[0];
		const match = path.match(re);
		if (!match) continue;
		const params = match.groups || {};

		if (pageContext) {
			const guards = route[2] as Array<PageRouteGuard>;
			let guarded = false;
			const guardContext = { ...pageContext, params };
			for (const guard of guards) {
				if (!guard(guardContext)) {
					guarded = true;
					break;
				}
			}

			if (guarded) {
				continue;
			}
		}

		return {
			route,
			params,
		};
	}
}

export interface RouteMatch<T> {
	route: T;
	params: Record<string, string>;
}
