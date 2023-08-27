export function routeToRegExp(
	route: string,
): [regexp: RegExp, restName?: string] {
	// Backslash and double dash to slash
	route = route.replace(/\\|--/g, "/");

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
					.filter((segment) => segment !== "index" && !segment.startsWith("_"))
					.map((segment) =>
						/* Split subsegments. E.g. hello-[name]-[surname] => hello-, [name], -, [surname]*/ segment
							.split(/(?=\[)|(?<=\])/g)
							.map((sub) => {
								if (sub.startsWith("[")) {
									return sub;
								}

								return normalizePathSegment(sub);
							})
							.join(""),
					)
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
				(restParamName ? `(?<${restParamName}>(\\/.*)?$)` : "\\/?$"),
		),
		restParamName,
	];
}

type Route = [pattern: string, ...rest: unknown[]];

export function sortRoutes<R extends Route>(routes: R[]) {
	const processedRoutes1 = routes.map((route) => ({
		original: route,
		dynamicCount: route[0].match(/\[/g)?.length || 0,
		isRest: !!route[0].match(/\/\[\.\.\.([a-zA-Z_][a-zA-Z0-9_]*)\]$/),
		segments: route[0]
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

		// Fewer routes first
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
	const definedOrder = Number(a === undefined) - Number(b === undefined);
	if (definedOrder) return definedOrder;

	// Lowest number of occurences of "[" wins
	return (
		a!.paramCount - b!.paramCount ||
		// Alphabetical order
		a!.content.localeCompare(b!.content)
	);
}

/*
    RFC 3986 bans square brackets, vertical bar, and caret but
    WhatWG URL standard allows them. Still:
    - Firefox and Chrome escape caret
    - Chrome also escapes vertical bar
    - Chrome doesn't allow %00 in decoded or encoded form
	We'll escape caret and vertical for compatibility
*/
const PATH_CHARS = /[A-Za-z0-9-._~!$&'()*+,;=:@[\]]/;

export function normalizePathSegment(segment: string): string {
	// - Apply Unicode Normalization Form C (Canonical Decomposition followed by Canonical Composition)
	// - Encode stray percent signs that are not followed by two hex digits
	// - Decode percent-encoded chars that are allowed in pathnames
	// - Convert all percent encodings to uppercase
	// - Encode non-alllowed chars
	// - Encode . and ..

	const result = segment
		.normalize("NFC")
		.replace(
			/%(?:[0-9a-fA-F]{2})|[^A-Za-z0-9-._~!$&'()*+,;=:@[\]]/gu,
			(match) => {
				if (match.length < 3) {
					return encodeURIComponent(match);
				} else if (match[1] <= "7") {
					const decoded = decodeURIComponent(match);
					if (decoded.match(PATH_CHARS)) {
						return decoded;
					}
				}

				return match.toUpperCase();
			},
		);

	if (result === ".") {
		return "%2E";
	} else if (result === "..") {
		return "%2E%2E";
	}

	return result;
}
