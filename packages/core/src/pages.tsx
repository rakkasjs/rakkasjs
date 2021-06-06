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

interface PageModuleImporters {
	params: Record<string, string>;
	match?: string;
	stack: Array<LayoutImporter | PageImporter>;
}

export function findPage(path: string): PageModuleImporters {
	const segments = path.split("/").filter(Boolean);
	let node = trie;
	const params: Record<string, string> = {};
	const stack: Array<LayoutImporter | PageImporter> = node.$layout
		? [node.$layout]
		: [];
	const matchPath: string[] = [];

	for (const segment of segments) {
		if (node[segment]) {
			node = node[segment];
			matchPath.push(segment);
		} else {
			const param = Object.keys(node).find(
				(k) => k.startsWith("[") && k.endsWith("]"),
			);

			if (!param) {
				return {
					params,
					stack,
				};
			}

			node = node[param];
			params[param.slice(1, -1)] = segment;
			matchPath.push(param);
		}

		if (node.$layout) {
			stack.push(node.$layout);
		}
	}

	if (!node.$page) {
		return {
			params,
			stack,
		};
	}

	stack.push(node.$page);

	return {
		params,
		stack,
		match: "/" + matchPath.join("/"),
	};
}
