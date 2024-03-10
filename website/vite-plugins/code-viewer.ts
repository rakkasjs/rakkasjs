import path from "node:path";
import { Plugin } from "vite";

const FROM_REPO = true;

export default function frontmatterLoader(): Plugin {
	let root: string;

	return {
		name: "rakkas:website:code-viewer",

		enforce: "pre",

		configResolved(config) {
			root = config.root;
		},

		async transform(code, id) {
			const url = new URL(id, "file://");
			if (!url.pathname.endsWith(".mdx")) return;

			let importInjected = false;

			const output = code.replace(
				/<CodeViewer\s+name="([a-zA-Z0-9_-]+)"/g,
				(_: string, name) => {
					let code: string;

					if (FROM_REPO) {
						code = `<CodeViewer name=${JSON.stringify(name)}`;
					} else {
						const pattern = path.relative(
							path.dirname(url.pathname),
							path.join(root, "../examples", name + "/**/*"),
						);

						code = `<CodeViewer name=${JSON.stringify(
							name,
						)} files={import.meta.glob(${JSON.stringify(
							pattern,
						)}, { query: "?raw", eager: true })}`;
					}

					if (!importInjected) {
						code = "import CodeViewer from 'lib/CodeViewer';\n\n" + code;
						importInjected = true;
					}

					return code;
				},
			);

			return output;
		},
	};
}
