export type Route = [
	regexp: RegExp,
	pattern: string,
	importers: Array<() => Promise<any>>,
];

export function findRoute(
	path: string,
	routes: Route[],
	force?: boolean,
):
	| {
			params: Record<string, string>;
			match?: string;
			stack: Array<() => Promise<any>>;
	  }
	| undefined {
	let notFound = false;

	for (;;) {
		for (const route of routes) {
			const [regep, pattern, importers] = route;
			const match = path.match(regep);

			if (match) {
				const names = [...pattern.matchAll(/\[([^\]]+)\]/g)].map((x) => x[1]);

				const params = Object.fromEntries(
					match?.slice(1).map((m, i) => [names[i], decodeURIComponent(m)]),
				);

				return {
					params,
					match: notFound ? undefined : pattern,
					stack: importers,
				};
			}
		}

		if (!force || path === "/") return undefined;
		notFound = true;

		path = path.slice(0, path.lastIndexOf("/"));
	}
}
