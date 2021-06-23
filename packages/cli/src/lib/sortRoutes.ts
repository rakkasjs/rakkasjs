interface Route<T> {
	pattern: string;
	content: T;
}

export interface RouteWithRegExp<T> {
	pattern: string;
	regexp: RegExp;
	paramNames: string[];
	content: T;
}

/**
 * Sorts routes by specificity
 */
export function sortRoutes<T>(
	routes: Array<Route<T>>,
): Array<RouteWithRegExp<T>> {
	const segmentedRoutes = routes.map(parseRouteIntoSegments);
	segmentedRoutes.sort(compareRoutes);

	return segmentedRoutes.map((seg) => ({
		pattern: "/" + seg.segments.map((s) => s.text).join("/"),
		regexp: seg.regexp,
		paramNames: seg.paramNames,
		content: seg.route.content,
	}));
}

function compareRoutes(
	a: ParsedRoute<unknown>,
	b: ParsedRoute<unknown>,
): number {
	for (const [i, aseg] of a.segments.entries()) {
		const bseg = b.segments[i];
		if (!bseg) {
			return 1;
		}

		if (aseg.text === bseg.text) continue;

		const patternDiff = Number(aseg.hasPattern) - Number(bseg.hasPattern);
		if (patternDiff) {
			return patternDiff;
		}

		if (aseg.hasPattern) {
			// First one to have a non-placeholder wins
			for (const [j, asub] of aseg.subsegments.entries()) {
				const bsub = (bseg as PlaceholderSegment).subsegments[j];

				if (!bsub) {
					return -1;
				}

				const placeholderDiff =
					Number(asub[0] === "[") - Number(bsub[0] === "[");

				if (placeholderDiff) {
					return placeholderDiff;
				}
			}

			if (
				(bseg as PlaceholderSegment).subsegments.length >
				aseg.subsegments.length
			)
				return 1;
		}

		return aseg.text.localeCompare(bseg.text);
	}

	return a.segments.length - b.segments.length;
}

function parseRouteIntoSegments<T>(route: Route<T>): ParsedRoute<T> {
	if (!route.pattern.startsWith("/"))
		throw new Error(`Invalid route pattern: ${route.pattern}`);

	const segments = route.pattern
		.slice(1)
		.split("/")
		.filter((s) => s[0] !== "_")
		.map((s) => {
			function invalid() {
				throw new Error(`Invalid route segment "${s}" in ${route.pattern}`);
			}

			if (s.includes("[")) {
				// Split right before "[" and right after "]"
				// The original clever idea was: split(/(?=\[)|(?<=\])/) but lookbehind support is still lacking in browsers
				const subsegments = splitIntoSubSegments(s).map((sub, i, subs) => {
					if (sub[0] === "[") {
						if (!sub.endsWith("]") || sub.slice(1, -1).match(/\]/)) invalid();
					} else {
						if (sub.endsWith("]")) invalid();

						// Accepted separators are "." and "-" except in the beginning and in the end
						if (
							(i > 0 && !sub.match("^[.-]")) ||
							(i < subs.length - 1 && !sub.match("[.-]$"))
						) {
							invalid();
						}
					}

					return sub;
				});

				return {
					text: s,
					hasPattern: true,
					subsegments,
				} as PlaceholderSegment;
			} else {
				if (s.includes("]")) {
					invalid();
				}

				return {
					text: s,
					hasPattern: false,
				} as SimpleSegment;
			}
		});

	let regexp =
		"^\\/" +
		segments
			.map((seg) => {
				if (seg.hasPattern) {
					return seg.subsegments
						.map((sub) => {
							if (sub[0] === "[") {
								return "([^\\/]+)";
							} else {
								return escapeRegExp(sub);
							}
						})
						.join("");
				} else {
					return escapeRegExp(seg.text);
				}
			})
			.join("\\/");

	if (!regexp.endsWith("\\/")) {
		regexp += "\\/";
	}

	regexp += "?$";

	return {
		route,
		segments,
		paramNames: (
			segments.filter((seg) => seg.hasPattern) as PlaceholderSegment[]
		)
			.map((seg) =>
				seg.subsegments
					.filter((sub) => sub[0] === "[")
					.map((sub) => sub.slice(1, -1)),
			)
			.flat(),
		regexp: new RegExp(regexp),
	};
}

function escapeRegExp(s: string) {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function splitIntoSubSegments(s: string): string[] {
	const result: string[] = [];
	let pos = 0;

	while (pos < s.length) {
		const start = s.indexOf("[", pos);
		if (start < 0) {
			result.push(s.slice(pos));
			return result;
		}

		if (
			start &&
			(s[start - 1] === "." ||
				s[start - 1] === "-" ||
				s[start - 1] === undefined)
		) {
			result.push(s.slice(pos, start));
		}

		const end = s.indexOf("]", start);

		if (end < 0) {
			result.push(s.slice(pos));
			return result;
		}

		if (s[end + 1] === "." || s[end + 1] === "-" || s[end + 1] === undefined) {
			result.push(s.slice(start, end + 1));
		}

		pos = end + 1;
	}

	return result;
}

type RouteSegment = SimpleSegment | PlaceholderSegment;

interface SimpleSegment {
	text: string;
	hasPattern: false;
}

interface PlaceholderSegment {
	text: string;
	hasPattern: true;
	subsegments: string[];
}

interface Route<T> {
	pattern: string;
	content: T;
}

interface ParsedRoute<T> {
	segments: RouteSegment[];
	route: Route<T>;
	regexp: RegExp;
	paramNames: string[];
}
