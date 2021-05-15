import ts from "@wessberg/rollup-plugin-ts";
import { terser } from "rollup-plugin-terser";
import nodeResolvePlugin from "@rollup/plugin-node-resolve";
import pkg from "./package.json";

const isProd = process.env.NODE_ENV === "production";

/** @type {import('rollup').RollupOptions} */
const options = {
	input: "src/index.tsx",
	output: {
		file: pkg.module,
		format: "esm",
		plugins: isProd ? [terser()] : [],
	},
	external: ["react", "$app/App.jsx"],
	plugins: [ts({ transpiler: "babel" }), nodeResolvePlugin()],
};

export default options;
