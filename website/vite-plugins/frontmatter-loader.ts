import { PluginOption } from "vite";
import fs from "fs";
import grayMatter from "gray-matter";

export default function frontmatterLoader(): PluginOption {
	let root: string;

	return {
		name: "rakkas:website:front-matter",

		enforce: "pre",

		configResolved(config) {
			root = config.root;
		},

		async resolveId(id, importer, options) {
			if (hasFrontmatterQuery(id)) {
				const resolved = await this.resolve(id, importer, {
					...options,
					skipSelf: true,
				});
				if (!resolved) return;

				let [path, query] = splitQuery(resolved.id);

				const params = new URLSearchParams(query);
				params.delete("ext");
				query = params.toString();

				// Remove path extension
				path = path.replace(/\.[^.]+$/, "");

				resolved.id = path + (query ? "?" + query : "");

				return resolved;
			}
		},

		async load(id) {
			if (!hasFrontmatterQuery(id)) return;

			const [filename] = splitQuery(id);
			const content = await fs.promises.readFile(
				root + "/" + filename + ".mdx",
				"utf8",
			);
			const { data } = grayMatter(content);

			return {
				code: `export default ${JSON.stringify(data)}`,
			};
		},
	};
}

function hasFrontmatterQuery(id: string): boolean {
	const query = id.split("?")[1] || "";
	const params = new URLSearchParams(query);
	return params.has("frontmatter");
}

function splitQuery(id: string): [path: string, query: string] {
	const qpos = id.indexOf("?");
	return qpos === -1 ? [id, ""] : [id.slice(0, qpos), id.slice(qpos + 1)];
}
