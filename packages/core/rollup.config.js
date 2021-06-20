import ts from "rollup-plugin-ts";
import nodeResolvePlugin from "@rollup/plugin-node-resolve";
import cjs from "@rollup/plugin-commonjs";
// import { terser } from "rollup-plugin-terser";

const isProd = process.env.NODE_ENV === "production";

/** @type {import('rollup').RollupOptions[]} */
const options = [
	{
		input: [
			"src/index.tsx",
			"src/client.tsx",
			"src/server.tsx",
			"src/helmet.ts",
		],
		output: {
			dir: "dist",
			format: "esm",
			plugins: isProd
				? [
						// TODO: Investigate why terser breaks the build
						// terser()
				  ]
				: [],
		},
		external: [
			"@rakkasjs/pages-and-layouts",
			"@rakkasjs/endpoints-and-middleware",
			"react",
			"react-dom",
			"react-dom/server",
			"node-fetch",
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
			cjs(),
			nodeResolvePlugin(),
		],
	},
];

export default options;
