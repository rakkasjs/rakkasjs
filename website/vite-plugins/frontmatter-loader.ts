import fs from "node:fs";
import path from "node:path";
import { Plugin } from "vite";
import grayMatter from "gray-matter";

export default function frontmatterLoader(): Plugin {
	let root: string;

	return {
		name: "rakkas:website:front-matter",

		enforce: "pre",

		configResolved(config) {
			root = config.root;
		},

		async resolveId(id, importer, options) {
			if (hasFrontmatterQuery(id)) {
				// eslint-disable-next-line prefer-const
				let [cleanId, query] = splitQuery(id);
				const resolved = await this.resolve(cleanId, importer, {
					...options,
					skipSelf: true,
				});
				if (!resolved) return;

				const params = new URLSearchParams(query);
				params.delete("ext");
				query = params.toString();

				// Remove path extension
				const path = resolved.id.replace(/\.[^.]+$/, "");

				resolved.id = splitQuery(path)[0] + ".frontmatter";

				// console.log(resolved);
				return resolved;
			}
		},

		async load(id) {
			if (!id.endsWith(".frontmatter")) return;
			const filename = id.slice(0, -".frontmatter".length);

			const content = await fs.promises.readFile(filename, "utf8").catch(() => {
				return fs.promises.readFile(
					path.resolve(root, "./" + filename),
					"utf8",
				);
			});

			const { data } = grayMatter(content);

			return `export default ${JSON.stringify(data)}`;
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
