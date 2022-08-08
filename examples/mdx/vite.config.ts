import { defineConfig } from "vite";
import rakkas from "rakkasjs/vite-plugin";
import mdx from "@cyco130/vite-plugin-mdx";

export default defineConfig({
	plugins: [
		mdx(),
		rakkas({
			pageExtensions: ["jsx", "tsx", "mdx"],
		}),
	],
});
