import { ComponentType } from "react";

import endpoints from "@rakkasjs:endpoints";
import { RawRequest } from "./server";

const trie: any = {};
endpoints.forEach(([page, importer]) => {
	let name = page.match(/^((.+)[\./])?endpoint\.[a-zA-Z0-9]+$/)![2] || "";
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
	params: Record<string, any>;
}

interface RakkasResponse {
	status?: number;
	headers?: Record<string, string>;
	body?: any;
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
	const params: any = {};

	for (const segment of segments) {
		if (node[segment]) {
			node = node[segment];
		} else {
			let param = Object.keys(node).find(
				(k) => k.startsWith("[") && k.endsWith("]"),
			);

			if (!param) {
				return undefined;
			}

			node = node[param];
			params[param.slice(1, -1)] = segment;
		}
	}

	console.log(node);

	return node.$endpoint && { importer: node.$endpoint, params };
}
