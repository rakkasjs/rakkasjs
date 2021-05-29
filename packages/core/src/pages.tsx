import { ComponentType } from "react";
import type { LoadArgs } from ".";

const pages = import.meta.glob(
	"/src/pages/**/(*.)?page.[[:alnum:]]+",
) as Record<string, () => Promise<PageOrLayoutModule>>;

const layouts = import.meta.glob(
	"/src/pages/**/(*.)?layout.[[:alnum:]]+",
) as Record<string, () => Promise<PageOrLayoutModule>>;

const trie: any = {};
Object.entries(pages).forEach(([page, importer]) => {
	let name =
		page.match(/^\/src\/pages\/((.+)[\./])?page\.[a-zA-Z0-9]+$/)![2] || "";
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
	let name =
		layout.match(/^\/src\/pages\/((.+)[\./])?layout\.[a-zA-Z0-9]+$/)![2] || "";
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

interface PageOrLayoutModule {
	default: ComponentType;
	load?(loadArgs: LoadArgs): Promise<any>;
}

export type PageOrLayoutImporter = () =>
	| Promise<PageOrLayoutModule>
	| PageOrLayoutModule;

export function findPage(
	path: string,
	notFound: PageOrLayoutImporter,
): { params: any; stack: PageOrLayoutImporter[] } {
	const segments = path.split("/").filter(Boolean);
	let node = trie;
	const params: any = {};
	const stack: PageOrLayoutImporter[] = node.$layout ? [node.$layout] : [];

	for (const segment of segments) {
		if (node[segment]) {
			node = node[segment];
		} else {
			let param = Object.keys(node).find(
				(k) => k.startsWith("[") && k.endsWith("]"),
			);

			if (!param) {
				stack.push(notFound);
				return { params, stack };
			}

			node = node[param];
			params[param.slice(1, -1)] = segment;
		}

		if (node.$layout) {
			stack.push(node.$layout);
		}
	}

	stack.push(node.$page ?? notFound);

	return { params, stack };
}
