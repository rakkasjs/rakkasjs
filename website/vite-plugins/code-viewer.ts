import { PluginOption } from "vite";
import path from "path";

export default function frontmatterLoader(): PluginOption {
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

			return code.replace(
				/<CodeViewer name="([a-zA-Z0-9_-]+)" \/>/g,
				(_: string, name) => {
					const pattern = path.relative(
						path.dirname(url.pathname),
						path.join(root, "../code-samples", name + "/**/*"),
					);

					let code = `<CodeViewer name=${JSON.stringify(
						name,
					)} files={import.meta.glob(${JSON.stringify(
						pattern,
					)}, { as: "raw", eager: true })} />`;

					if (!importInjected) {
						code = "import CodeViewer from 'lib/CodeViewer';\n\n" + code;
						importInjected = true;
					}

					return code;
				},
			);
		},
	};
}
