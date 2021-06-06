const endpoints = import.meta.glob(
	"/src/pages/**/(*.)?endpoint.[[:alnum:]]+",
) as Record<string, () => Promise<EndpointModule>>;

import { RawRequest } from "./server";
import { RakkasResponse } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const trie: any = {};

Object.entries(endpoints).forEach(([page, importer]) => {
	const name =
		page.match(/^\/src\/pages\/((.+)[./])?endpoint\.[a-zA-Z0-9]+$/)![2] || "";
	const segments = name.split("/").filter(Boolean);

	let node = trie;
	for (const segment of segments) {
		if (!node[segment]) {
			node[segment] = {};
		}
		node = node[segment];
	}

	node.$endpoint = importer;
});

interface RakkasRequest {
	params: Record<string, unknown>;
}

interface EndpointModule {
	[method: string]: (
		request: RakkasRequest,
	) => RakkasResponse | Promise<RakkasResponse>;
}

export type EndpointImporter = () => Promise<EndpointModule> | EndpointModule;

export function findEndpoint(
	req: RawRequest,
): { importer: EndpointImporter; params: Record<string, string> } | undefined {
	const segments = req.url.pathname.split("/").filter(Boolean);
	let node = trie;
	const params: Record<string, unknown> = {};

	for (const segment of segments) {
		if (node[segment]) {
			node = node[segment];
		} else {
			const param = Object.keys(node).find(
				(k) => k.startsWith("[") && k.endsWith("]"),
			);

			if (!param) {
				return undefined;
			}

			node = node[param];
			params[param.slice(1, -1)] = segment;
		}
	}

	return node.$endpoint && { importer: node.$endpoint, params };
}
