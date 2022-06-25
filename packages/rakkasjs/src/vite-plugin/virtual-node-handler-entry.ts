import { Plugin } from "vite";

export function virtualNodeHandlerEntry(): Plugin {
	return {
		name: "rakkasjs:client-entry",

		enforce: "pre",

		resolveId(id) {
			if (id === "/virtual:rakkasjs:node-handler-entry") {
				return "/virtual:rakkasjs:node-handler-entry";
			}
		},

		async load(id) {
			if (id === "/virtual:rakkasjs:node-handler-entry") {
				return MODULE_CONTENTS;
			}
		},
	};
}

const MODULE_CONTENTS = `
	import { hattipHandler } from "rakkasjs";
	import { createMiddleware } from "rakkasjs/node-adapter";

	export default createMiddleware(hattipHandler);
`;
