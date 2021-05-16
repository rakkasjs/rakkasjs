import React, { ComponentType } from "react";
import type { RouteRenderArgs } from "@rakkasjs/core";

import pages from "@rakkasjs:pages";
import layouts from "@rakkasjs:layouts";

console.log("Running routes");

const trie: any = {};
pages.forEach(([page, importer]) => {
	console.log("page", page);
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

export async function findAndRenderRoute({
	url: { pathname },
}: RouteRenderArgs) {
	const segments = pathname.split("/").filter(Boolean);

	let node = trie;
	const params: any = {};
	const layoutStack: { default: ComponentType }[] = node.$layout
		? [await node.$layout()]
		: [];

	for (const segment of segments) {
		if (node[segment]) {
			node = node[segment];
		} else {
			let param = Object.keys(node).find(
				(k) => k.startsWith("[") && k.endsWith("]"),
			);

			if (!param) return <p>Page not found</p>;

			node = node[param];
			params[param.slice(1, -1)] = segment;
		}

		if (node.$layout) {
			layoutStack.push(await node.$layout());
		}
	}

	if (!node.$page) {
		return <p>Page not found</p>;
	}

	console.log("params", params);

	const page: { default: ComponentType } = await node.$page();

	return [...layoutStack, page].reduceRight(
		(prev, cur) => React.createElement(cur.default, {}, prev),
		null as React.ReactNode,
	);
}
