import ts from "rollup-plugin-ts";
import { terser } from "rollup-plugin-terser";
import nodeResolvePlugin from "@rollup/plugin-node-resolve";

const isProd = process.env.NODE_ENV === "production";

/** @type {import('rollup').RollupOptions[]} */
const options = [
	{
		input: ["src/index.tsx", "src/client.tsx", "src/server.tsx"],
		output: {
			dir: "dist",
			format: "esm",
			plugins: isProd ? [terser()] : [],
		},
		external: [
			"react",
			"react-dom",
			"react-dom/server",
			"react-helmet-async",
			"node-fetch",
			"$app/App.jsx",
		],
		plugins: [
			ts({
				transpiler: "babel",
				browserslist: [
					"last 2 and_chr versions",
					"last 2 android versions",
					"last 2 ios versions",
					"ios 12.1", // Still supported on old devices
					"last 2 chrome versions",
					"last 2 safari versions",
					"last 2 edge versions",
					"last 2 firefox versions",
					"firefox esr",
					"maintained node versions",
				],
			}),
			nodeResolvePlugin(),
		],
	},
];

export default options;
