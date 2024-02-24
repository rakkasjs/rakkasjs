import type { Plugin } from "vite";
import type {} from "rakkasjs/vite-plugin";

export function rakkasCss(): Plugin {
	return {
		name: "@rakkasjs/css",
		config() {
			return { ssr: { noExternal: ["@rakkasjs/css"] } };
		},
		api: {
			rakkas: {
				serverHooks: "@rakkasjs/css/server-hooks",
			},
		},
	};
}
