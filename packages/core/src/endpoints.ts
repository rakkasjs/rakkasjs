import { sortRoutes } from "./sortRoutes";
import type {
	EndpointImporter,
	MiddlewareImporter,
	RawRequest,
} from "./server";
import { endpoints, middleware } from "@rakkasjs/endpoints-and-middleware";

const sortedMiddleware = Object.entries(middleware)
	.map(([key, importer]) => {
		const id =
			"/" +
			(key.match(/^\/pages\/((.+)[./])?middleware\.[a-zA-Z0-9]+$/)![2] || "");

		return {
			id,
			segments: id.split("/").filter(Boolean),
			importer: importer,
		};
	})
	.sort((a, b) => {
		// First if more segments
		const lenDif = b.segments.length - a.segments.length;
		if (lenDif) return lenDif;

		// Otherwise alphabetical
		return a.id.localeCompare(b.id);
	});

const sorted = sortRoutes(
	Object.entries(endpoints).map(([key, importer]) => {
		const id =
			"/" +
			(key.match(/^\/pages\/((.+)[./])?endpoint\.[a-zA-Z0-9]+$/)![2] || "");

		return {
			pattern: id,
			extra: {
				id,
				importer,
				middleware: sortedMiddleware.filter((m) => {
					const res =
						id === m.id || id.startsWith(m.id === "/" ? "/" : m.id + "/");
					return res;
				}),
			},
		};
	}),
);

export function findEndpoint(req: RawRequest):
	| {
			params: Record<string, string>;
			match: string;
			stack: Array<EndpointImporter | MiddlewareImporter>;
	  }
	| undefined {
	const path = decodeURI(req.url.pathname);

	for (const e of sorted) {
		const match = path.match(e.regexp);
		if (match) {
			const params = Object.fromEntries(
				match?.slice(1).map((m, i) => [e.paramNames[i], decodeURIComponent(m)]),
			);

			return {
				params,
				match: e.pattern,
				stack: [e.extra, ...e.extra.middleware]
					.map((x) => x.importer)
					.reverse(),
			};
		}
	}

	return undefined;
}
