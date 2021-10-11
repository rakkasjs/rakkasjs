import mdx from "vite-plugin-mdx";

export default {
	pageExtensions: ["tsx", "jsx", "mdx"],
	vite: { plugins: [mdx()] },
};
