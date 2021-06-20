import { sortRoutes } from "./sortRoutes";
import { LayoutImporter, PageImporter } from ".";

import { pages, layouts } from "@rakkasjs/pages-and-layouts";

const sortedLayouts = Object.entries(layouts)
	.map(([key, importer]) => {
		const id =
			"/" + (key.match(/^\/pages\/((.+)[./])?layout\.[a-zA-Z0-9]+$/)![2] || "");

		return {
			id,
			segments: id.split("/").filter(Boolean),
			importer,
		};
	})
	.sort((a, b) => {
		// First if more segments
		const lenDif = b.segments.length - a.segments.length;
		if (lenDif) return lenDif;

		return a.id.localeCompare(b.id);
	});

const sorted = sortRoutes(
	Object.entries(pages).map(([key, importer]) => {
		const id =
			"/" + (key.match(/^\/pages\/((.+)[./])?page\.[a-zA-Z0-9]+$/)![2] || "");

		return {
			pattern: id,
			extra: {
				id,
				importer,
				layouts: sortedLayouts.filter((l) => {
					const res =
						id === l.id || id.startsWith(l.id === "/" ? "/" : l.id + "/");
					return res;
				}),
			},
		};
	}),
);

interface PageModuleImporters {
	params: Record<string, string>;
	match?: string;
	stack: Array<LayoutImporter | PageImporter>;
}

export function findPage(path: string): PageModuleImporters {
	path = decodeURI(path);
	let notFound = false;

	for (;;) {
		for (const r of sorted) {
			const match = path.match(r.regexp);
			if (match) {
				const params = Object.fromEntries(
					match
						?.slice(1)
						.map((m, i) => [r.paramNames[i], decodeURIComponent(m)]),
				);

				return {
					params,
					match: notFound ? undefined : r.pattern,
					stack: [r.extra, ...r.extra.layouts].map((x) => x.importer).reverse(),
				};
			}
		}

		notFound = true;
		const slashIndex = path.lastIndexOf("/");
		if (slashIndex < 0) {
			return {
				params: {},
				stack: [],
			};
		}

		if (path === "/") break;

		path = path.slice(0, slashIndex) || "/";
	}

	return {
		params: {},
		stack: [],
	};
}
