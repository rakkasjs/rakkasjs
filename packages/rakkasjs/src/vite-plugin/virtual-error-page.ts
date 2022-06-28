import { Plugin } from "vite";

export function virtualErrorPage(): Plugin {
	return {
		name: "rakkasjs:error-page",

		enforce: "pre",

		async resolveId(id) {
			if (id === "virtual:rakkasjs:error-page") {
				const userEntry = await this.resolve("/src/routes/$error");
				return userEntry ?? "/virtual:rakkasjs:error-page";
			}
		},

		async load(id) {
			if (id === "/virtual:rakkasjs:error-page") {
				return MODULE_CONTENTS;
			}
		},
	};
}

const MODULE_CONTENTS = `
	export { DefaultErrorPage as default } from "rakkasjs";
`;
