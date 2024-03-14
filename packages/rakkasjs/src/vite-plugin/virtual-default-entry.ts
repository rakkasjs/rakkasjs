import path from "node:path";
import type { Plugin } from "vite";

export interface VirtualDefaultEntryOptions {
	virtualName: string;
	entry: string;
	defaultContent: string;
	resolveName?: boolean;
}

export function virtualDefaultEntry(
	options: VirtualDefaultEntryOptions,
): Plugin {
	const { defaultContent, entry, virtualName, resolveName = true } = options;
	let fallback: string;

	return {
		name: "rakkasjs:default-entry",

		enforce: "pre",

		async configResolved(config) {
			if (resolveName) {
				fallback = path
					.resolve(config.root, entry.slice(1) + ".default.js")
					.replace(/\\/g, "/");
			} else {
				fallback = "\0virtual:rakkasjs:" + virtualName;
			}
		},

		async resolveId(id) {
			if (
				id === "rakkasjs:" + virtualName ||
				id === "/rakkasjs:" + virtualName ||
				id === entry + ".default.js"
			) {
				const userEntry = await this.resolve(entry);
				return userEntry ?? fallback;
			}
		},

		async load(id) {
			if (id === fallback) {
				return defaultContent;
			}
		},
	};
}
