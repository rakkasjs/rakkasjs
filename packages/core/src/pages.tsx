import { sortRoutes } from "./sortRoutes";
import {
	LayoutImporter,
	LayoutModule,
	PageImporter,
	PageModule,
} from "./types";

const pages = import.meta.glob(
	"/src/pages/**/(*.)?page.[[:alnum:]]+",
) as Record<string, () => Promise<PageModule>>;

const layouts = import.meta.glob(
	"/src/pages/**/(*/)?layout.[[:alnum:]]+",
) as Record<string, () => Promise<LayoutModule>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const trie: any = {};

Object.entries(pages).forEach(([page, importer]) => {
	const name =
		page.match(/^\/src\/pages\/((.+)[./])?page\.[a-zA-Z0-9]+$/)![2] || "";
	const segments = name.split("/").filter(Boolean);

	let node = trie;
	for (const segment of segments) {
		if (!node[segment]) {
			node[segment] = {};
		}
		node = node[segment];
	}

	node.$page = importer;
});

Object.entries(layouts).forEach(([layout, importer]) => {
	const name =
		layout.match(/^\/src\/pages\/((.+)[./])?layout\.[a-zA-Z0-9]+$/)![2] || "";
	const segments = name.split("/").filter(Boolean);

	let node = trie;
	for (const segment of segments) {
		if (!node[segment]) {
			node[segment] = {};
		}
		node = node[segment];
	}

	node.$layout = importer;
});

const sortedLayouts = Object.entries(layouts)
	.map(([k, l]) => {
		const name =
			"/" +
			(k.match(/^\/src\/pages\/((.+)[./])?layout\.[a-zA-Z0-9]+$/)![2] || "");

		return {
			path: name,
			segments: name.split("/").filter(Boolean),
			importer: l,
		};
	})
	.sort((a, b) => {
		// First if more segments
		const lenDif = b.segments.length - a.segments.length;
		if (lenDif) return lenDif;

		return a.path.localeCompare(b.path);
	});

const sorted = sortRoutes(
	Object.entries(pages).map(([name, importer]) => {
		const pattern =
			"/" +
			(name.match(/^\/src\/pages\/((.+)[./])?page\.[a-zA-Z0-9]+$/)![2] || "");

		return {
			pattern,
			extra: {
				name,
				importer,
				layouts: sortedLayouts.filter((l) => {
					const res =
						pattern === l.path ||
						pattern.startsWith(l.path === "/" ? "/" : l.path + "/");
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
	let notFound = false;

	for (;;) {
		for (const r of sorted) {
			const match = path.match(r.regexp);
			if (match) {
				const params = Object.fromEntries(
					match?.slice(1).map((m, i) => [r.paramNames[i], m]),
				);

				if (notFound) {
					return {
						params,
						stack: [...r.extra.layouts].reverse().map((x) => x.importer),
					};
				}

				return {
					params,
					match: r.pattern,
					stack: [r.extra, ...r.extra.layouts].reverse().map((x) => x.importer),
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

		path = path.slice(0, slashIndex) || "/";
	}

	// Not found. Let's try to find the most specific path
}
