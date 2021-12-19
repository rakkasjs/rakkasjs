import { defineConfig } from "@rakkasjs/cli";
import mdx from "vite-plugin-mdx";
import fs from "fs";
import path from "path";

// @ts-expect-error: No typings
import { highlight, loadLanguages } from "reprism";
// @ts-expect-error: No typings
import tsx from "reprism/languages/typescript.js";
// @ts-expect-error: No typings
import bash from "reprism/languages/bash.js";
// @ts-expect-error: No typings
import rhypePrism from "@mapbox/rehype-prism";

loadLanguages(tsx, bash);

export default defineConfig({
	pageExtensions: ["jsx", "tsx", "mdx"],
	prerender: ["/", "/404"],
	vite: {
		plugins: [
			mdx({ rehypePlugins: [rhypePrism] }),
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

		resolve: {
			alias: {
				"$lib": "/lib",
				"$examples": "/pages/examples",
			},
		},
	},
});
