import path from "node:path";
import fs from "node:fs";
import { PluginOption } from "vite";
// @ts-expect-error: No typings
import { highlight } from "reprism";

export default function sampleLoader(): PluginOption {
	return {
		name: "rakkas:website:sample-loader",

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
			const query = new URLSearchParams(id.split("?")[1]);
			if (!query.has("sample")) return;

			const filename = id.slice(0, -7);
			const content = fs.readFileSync(filename, "utf8");

			return {
				code: `export default {file: ${JSON.stringify(
					path.relative("src/pages/examples", filename),
				)}, code: ${JSON.stringify(highlight(content, "typescript"))}}`,
			};
		},
	};
}
