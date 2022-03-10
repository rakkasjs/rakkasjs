export function routeToRegExp(route: string): RegExp {
	return new RegExp(
		"^" +
			route
				.split("/")
				.filter((x) => x !== "index" && !x.startsWith("_"))
				.join("/")
				.replace(
					/\[[a-zA-Z_][a-zA-Z0-9_]*]/g,
					(name) => `(?<${name.slice(1, -1)}>[^/]*)`,
				) +
			"\\/?$",
	);
}

type Route = [pattern: string, ...rest: unknown[]];

export function sortRoutes<R extends Route>(routes: R[]) {
	const processedRoutes = routes
		.map((route) => ({
			original: route,
			segments: route[0]
				.split("/")
				.filter((x) => !x.startsWith("_") && x !== "index"),
		}))
		.sort((a, b) => {
			const aSegments = a.segments;
			const bSegments = b.segments;
			for (let i = 0; i < aSegments.length; i++) {
				const aSegment = aSegments[i];
				const bSegment = bSegments[i];
				const result = compareSegments(aSegment, bSegment);
				if (result !== 0) return result;
			}
			return 0;
		});

	return processedRoutes.map((route) => route.original);
}

function compareSegments(a: string, b: string) {
	// Lowest number of occurences of "[" wins
	return (
		a.split("[").length - b.split("[").length ||
		// Alphabetical order
		a.localeCompare(b)
	);
}
