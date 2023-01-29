export function routeToRegExp(
	route: string,
): [regexp: RegExp, restName?: string] {
	// Backslash to slash
	route = route.replace(/\\/g, "/");

	let restParamName: string | undefined;

	const restMatch = route.match(/\/\[\.\.\.([a-zA-Z_][a-zA-Z0-9_]*)\]$/);
	if (restMatch) {
		const [rest, restName] = restMatch;
		route = route.slice(0, -rest.length);
		restParamName = restName;
	}

	return [
		new RegExp(
			"^" +
				route
					.split("/")
					.filter(
						(x) => x !== "index" && !x.startsWith("_") && !x.match(/^\(.*\)$/),
					)
					.map((x) => {
						const escaped = encodeURIComponent(x);
						// Unescape [ and ]
						return escaped.replace(/%5B/g, "[").replace(/%5D/g, "]");
					})
					.join("/")
					.replace(
						// Escape special characters
						/[\\^$*+?.()|[\]{}]/g,
						(x) => `\\${x}`,
					)
					.replace(
						/\\\[[a-zA-Z_][a-zA-Z0-9_]*\\]/g,
						(name) => `(?<${name.slice(2, -2)}>[^/]*)`,
					) +
				(restParamName ? `(?<${restParamName}>(?:\\/.*)?$)` : "\\/?$"),
		),
		restParamName,
	];
}

type Route = { path: string };

export function sortRoutes<R extends Route>(routes: R[]) {
	const processedRoutes1 = routes.map((route) => ({
		original: route,
		dynamicCount: route.path.match(/\[/g)?.length || 0,
		isRest: !!route.path.match(/\/\[\.\.\.([a-zA-Z_][a-zA-Z0-9_]*)\]$/),
		segments: route.path
			.split("/")
			.filter((x) => !x.startsWith("_") && x !== "index")
			.map((seg) => ({
				content: seg,
				paramCount: seg.split("[").length - 1,
			})),
	}));

	const processedRoutes = processedRoutes1.sort((a, b) => {
		// Non-rest routes first
		const restDiff = Number(a.isRest) - Number(b.isRest);
		if (restDiff !== 0) {
			return restDiff;
		}

		// Routes with fewer dynamic segments first
		const dynamicOrder = a.dynamicCount - b.dynamicCount;
		if (dynamicOrder) return dynamicOrder;

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

interface Segment {
	content: string;
	paramCount: number;
}

function compareSegments(a?: Segment, b?: Segment) {
	const definedOrder = Number(b === undefined) - Number(a === undefined);
	if (definedOrder) return definedOrder;

	// Lowest number of occurences of "[" wins
	return (
		a!.paramCount - b!.paramCount ||
		// Alphabetical order
		a!.content.localeCompare(b!.content)
	);
}
