export function findRoute<T extends [RegExp, ...unknown[]]>(
	routes: T[],
	path: string,
): RouteMatch<T> | undefined {
	for (const route of routes) {
		const re = route[0];
		const match = path.match(re);
		if (!match) continue;

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
