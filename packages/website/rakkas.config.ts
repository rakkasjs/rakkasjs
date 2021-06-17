import { defineConfig } from "@rakkasjs/cli";
import mdx from "vite-plugin-mdx";

export default defineConfig({
	vite: {
		plugins: [mdx()],
	},
});
