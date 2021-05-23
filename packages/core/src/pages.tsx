import { ComponentType } from "react";
import type { LoadArgs } from ".";

import pages from "@rakkasjs:pages";
import layouts from "@rakkasjs:layouts";

const trie: any = {};
pages.forEach(([page, importer]) => {
	let name = page.match(/^((.+)[\./])?page\.[a-zA-Z0-9]+$/)![2] || "";
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

layouts.forEach(([layout, importer]) => {
	let name = layout.match(/^((.+)[\./])?layout\.[a-zA-Z0-9]+$/)![2] || "";
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
