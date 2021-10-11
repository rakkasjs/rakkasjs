import { defineConfig } from "@rakkasjs/cli";
import mdx from "vite-plugin-mdx";
import fs from "fs";

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
						const content = fs.readFileSync(id.slice(0, -7), "utf8");

						return {
							code: `export default ${JSON.stringify(
								highlight(content, "typescript"),
							)}`,
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
