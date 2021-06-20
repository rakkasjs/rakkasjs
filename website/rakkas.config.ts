import { defineConfig } from "@rakkasjs/cli";
import mdx from "vite-plugin-mdx";

export default defineConfig({
	pageExtensions: ["jsx", "tsx", "mdx"],
	vite: {
		plugins: [mdx()],
		resolve: {
			alias: {
				"$lib": "/lib",
			},
		},
	},
});
