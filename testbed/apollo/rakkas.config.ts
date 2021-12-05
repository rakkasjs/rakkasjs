import { defineConfig } from "@rakkasjs/cli";

export default defineConfig({
	vite: {
		// optimizeDeps: { include: ["@apollo/client"] },
		ssr: {
			external: ["@rakkasjs/apollo-server"],
		},
	},
});
