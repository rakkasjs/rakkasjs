import { Plugin } from "vite";

export function virtualHattipEntry(): Plugin {
	return {
		name: "rakkasjs:hattip-entry",

		enforce: "pre",

		async resolveId(id) {
			if (id === "virtual:rakkasjs:hattip-entry") {
				const userEntry = await this.resolve("/src/entry-hattip");
				return userEntry ?? "/virtual:rakkasjs:hattip-entry";
			}
		},

		async load(id) {
			if (id === "/virtual:rakkasjs:hattip-entry") {
				return MODULE_CONTENTS;
			}
		},
	};
}

const MODULE_CONTENTS = `
	import { createRequestHandler } from "rakkasjs";
	export default createRequestHandler();
`;
