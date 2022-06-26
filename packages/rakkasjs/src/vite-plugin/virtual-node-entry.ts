import { Plugin } from "vite";

export function virtualNodeEntry(): Plugin {
	return {
		name: "rakkasjs:node-entry",

		enforce: "pre",

		async resolveId(id) {
			if (id === "/virtual:rakkasjs:node-entry") {
				const userEntry = await this.resolve("/src/entry-node");
				return userEntry ?? "/virtual:rakkasjs:node-entry";
			}
		},

		async load(id) {
			if (id === "/virtual:rakkasjs:node-entry") {
				return MODULE_CONTENTS;
			}
		},
	};
}

const MODULE_CONTENTS = `
	import hattipHandler from "virtual:rakkasjs:hattip-entry";
	import { createMiddleware } from "rakkasjs/node-adapter";
	export default createMiddleware(hattipHandler);
`;
