import type { Plugin } from "vite";

export function rakkasTanstackQuery(): Plugin {
	return {
		name: "@rakkasjs/plugin-tanstack-query",
		api: {
			rakkas: {
				// Initial slash means it's in project root and not in node_modules
				clientHooks: "/plugin/client-hooks.tsx",
				serverHooks: "/plugin/server-hooks.tsx",
			},
		},
	};
}
