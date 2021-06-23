export type Route = [regexp: RegExp, pattern: string, ids: string[]];

export function findRoute(
	path: string,
	routes: Route[],
	force?: boolean,
):
	| {
			params: Record<string, string>;
			match?: string;
			stack: string[];
	  }
	| undefined {
	let notFound = false;

	for (;;) {
		for (const route of routes) {
			const [regep, pattern, moduleIds] = route;
			const match = path.match(regep);

			if (match) {
				const names = [...pattern.matchAll(/\[([^\]]+)\]/g)].map((x) => x[1]);

				const params = Object.fromEntries(
					match?.slice(1).map((m, i) => [names[i], decodeURIComponent(m)]),
				);

				return {
					params,
					match: notFound ? undefined : pattern,
					stack: moduleIds,
				};
			}
		}

		if (!force || path === "/") return undefined;
		notFound = true;

		path = path.slice(0, path.lastIndexOf("/"));
	}
}
