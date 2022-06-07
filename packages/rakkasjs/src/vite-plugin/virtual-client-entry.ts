import { Plugin } from "vite";

export function virtualClientEntry(): Plugin {
	return {
		name: "rakkasjs:client-entry",

		enforce: "pre",

		resolveId(id) {
			if (id === "/virtual:rakkasjs:client-entry") {
				return "virtual:rakkasjs:client-entry";
			}
		},

		async load(id) {
			if (id === "virtual:rakkasjs:client-entry") {
				return MODULE_CONTENTS;
			}
		},
	};
}

const MODULE_CONTENTS = `
	import { startClient } from "rakkasjs";
	startClient();
`;
