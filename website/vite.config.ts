import { defineConfig } from "vite";
import rakkas from "rakkasjs/vite-plugin";
import fs from "fs";
import path from "path";
import mdx from "@cyco130/vite-plugin-mdx";

// @ts-expect-error: No typings
import { highlight, loadLanguages } from "reprism";
// @ts-expect-error: No typings
import tsx from "reprism/languages/typescript.js";
// @ts-expect-error: No typings
import bash from "reprism/languages/bash.js";
// @ts-expect-error: No typings
import rhypePrism from "@mapbox/rehype-prism";
import remarkGfm from "remark-gfm";

loadLanguages(tsx.default, bash.default);

export default defineConfig({
	resolve: {
		alias: {
			$lib: "/src/lib",
			$examples: "/src/routes/examples",
		},
	},

	// TODO: Remove these if https://github.com/vitejs/vite/pull/8454 gets merged
	ssr: {
		noExternal: ["sanitize.css", "@docsearch/css"],
	},

	plugins: [
		mdx({
			remarkPlugins: [remarkGfm],
			rehypePlugins: [rhypePrism],
		}),

		rakkas({
			pageExtensions: ["jsx", "tsx", "mdx"],
		}),

		{
			name: "code-sample-loader",

			enforce: "pre",

			async resolveId(id, importer) {
				if (id.endsWith("?sample")) {
					const resolved = await this.resolve(id.slice(0, -7), importer, {
						skipSelf: true,
					});
					if (resolved) return resolved.id + "?sample";
				}
			},

			async load(id) {
				if (id.endsWith("?sample")) {
					const filename = id.slice(0, -7);
					const content = fs.readFileSync(filename, "utf8");

					return {
						code: `export default {file: ${JSON.stringify(
							path.relative("src/pages/examples", filename),
						)}, code: ${JSON.stringify(highlight(content, "typescript"))}}`,
					};
				}
			},
		},
	],
});
