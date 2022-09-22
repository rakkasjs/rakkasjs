import { defineConfig } from "vite";
import rakkas from "rakkasjs/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const dir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	ssr: {
		noExternal: ["react", "react-dom"],
	},
	plugins: [
		{
			name: "rakkasjs:preact",
			enforce: "pre",
			resolveId(id, _importer, { ssr }) {
				let path: string | undefined;
				switch (id) {
					case "react":
					case "react-dom":
						path = ssr ? "dist/compat.mjs" : "dist/compat.module.js";
						break;
					case "react-dom/client":
						path = "client.mjs";
						break;
					case "react/jsx-runtime":
					case "react/jsx-dev-runtime":
						path = "jsx-runtime.mjs";
						break;
				}

				if (path) {
					return resolve(dir, "node_modules/preact/compat", path);
				}
			},
		},
		tsconfigPaths(),
		rakkas(),
	],
});
