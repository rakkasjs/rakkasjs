import { defineConfig } from "vite";
import rakkas from "rakkasjs/vite-plugin";
import codeViewer from "./vite-plugins/code-viewer";
import sampleLoader from "./vite-plugins/sample-loader";
import frontmatterLoader from "./vite-plugins/frontmatter-loader";
import mdx from "@cyco130/vite-plugin-mdx";

// @ts-expect-error: No typings
import { loadLanguages } from "reprism";
// @ts-expect-error: No typings
import tsx from "reprism/languages/typescript.js";
// @ts-expect-error: No typings
import bash from "reprism/languages/bash.js";
// @ts-expect-error: No typings
import rhypePrism from "@mapbox/rehype-prism";
import remarkGfm from "remark-gfm";
import remarkFm from "remark-frontmatter";
import { cjsInterop } from "vite-plugin-cjs-interop";

loadLanguages(tsx.default, bash.default);

export default defineConfig({
	resolve: {
		alias: {
			lib: "/src/lib",
			examples: "/src/routes/examples",
		},
	},

	// TODO: Remove these if https://github.com/vitejs/vite/pull/8454 gets merged
	ssr: {
		noExternal: ["sanitize.css", "@docsearch/css"],
	},

	plugins: [
		codeViewer(),
		sampleLoader(),

		frontmatterLoader(),

		mdx({
			remarkPlugins: [remarkFm, remarkGfm],
			rehypePlugins: [rhypePrism],
			providerImportSource: "@mdx-js/react",
		}),

		rakkas({
			pageExtensions: ["jsx", "tsx", "mdx"],
			prerender: true,
		}),

		cjsInterop({
			dependencies: ["@docsearch/react"],
		}),
	],
});
