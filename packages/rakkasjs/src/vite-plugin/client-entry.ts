import { Plugin } from "vite";

export function clientEntry(): Plugin {
	return {
		name: "rakkasjs:client-entry",

		enforce: "pre",

		resolveId(id) {
			if (id === "/virtual:rakkasjs:client-entry") {
				return this.resolve("rakkasjs/runtime/client-entry");
			}
		},
	};
}
