import { PageContext } from "../lib";

export function findRoute<T extends [RegExp, ...unknown[]]>(
	routes: T[],
	path: string,
	pageContext?: PageContext,
): RouteMatch<T> | undefined {
	for (const route of routes) {
		const re = route[0];
		const match = path.match(re);
		if (!match) continue;

		if (pageContext) {
			const guards = route[2] as Array<(ctx: PageContext) => boolean>;
			let guarded = false;
			for (const guard of guards) {
				if (!guard(pageContext)) {
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
			params: match.groups || {},
		};
	}
}

export interface RouteMatch<T> {
	route: T;
	params: Record<string, string>;
}
