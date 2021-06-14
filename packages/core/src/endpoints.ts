import { sortRoutes } from "./sortRoutes";
import type { RawRequest, Middleware, RequestHandler } from "./server";

export interface EndpointModule {
	[method: string]: RequestHandler | undefined;
}

export interface MiddlewareModule {
	default: Middleware;
}

const endpoints = import.meta.glob(
	"/src/pages/**/(*.)?endpoint.[[:alnum:]]+",
) as Record<string, () => Promise<EndpointModule>>;

const middleware = import.meta.glob(
	"/src/pages/**/(*/)?middleware.[[:alnum:]]+",
) as Record<string, () => Promise<MiddlewareModule>>;

const sortedMiddleware = Object.entries(middleware)
	.map(([k, m]) => {
		const name =
			"/" +
			(k.match(/^\/src\/pages\/((.+)[./])?middleware\.[a-zA-Z0-9]+$/)![2] ||
				"");

		return {
			path: name,
			segments: name.split("/").filter(Boolean),
			importer: m,
		};
	})
	.sort((a, b) => {
		// First if more segments
		const lenDif = b.segments.length - a.segments.length;
		if (lenDif) return lenDif;

		return a.path.localeCompare(b.path);
	});

const sorted = sortRoutes(
	Object.entries(endpoints).map(([name, importer]) => {
		const pattern =
			"/" +
			(name.match(/^\/src\/pages\/((.+)[./])?endpoint\.[a-zA-Z0-9]+$/)![2] ||
				"");

		return {
			pattern,
			extra: {
				name,
				importer,
				middleware: sortedMiddleware.filter((m) => {
					const res =
						pattern === m.path ||
						pattern.startsWith(m.path === "/" ? "/" : m.path + "/");
					return res;
				}),
			},
		};
	}),
);

export function findEndpoint(req: RawRequest) {
	const path = req.url.pathname;

	for (const e of sorted) {
		const match = path.match(e.regexp);
		if (match) {
			const params = Object.fromEntries(
				match?.slice(1).map((m, i) => [e.paramNames[i], m]),
			);

			return {
				params,
				match: e.pattern,
				stack: [e.extra, ...e.extra.middleware]
					.reverse()
					.map((x) => x.importer),
			};
		}
	}

	return undefined;
}
