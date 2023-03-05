import { fileURLToPath } from "url";
import path from "path";
import cpr from "cpr";
import mkdirp from "mkdirp";
import { rimraf } from "rimraf";
import fs from "fs";
import { run } from "../src/utils";

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

async function main() {
	const __dirname = path.dirname(fileURLToPath(import.meta.url));
	let src = path.resolve(__dirname, "../../../examples/todo");
	let dest = path.resolve(__dirname, "../templates/ts");

	await rimraf(__dirname + "/../templates");
	await mkdirp(dest);

	await new Promise((resolve, reject) =>
		cpr(
			src,
			dest,
			{
				deleteFirst: true,
				filter(filename: string) {
					filename = filename.slice(src.length + 1).replace(/\\/g, "/");
					return !(
						filename.startsWith("node_modules/") || filename.startsWith("dist/")
					);
				},
			},
			(err, files) => {
				if (err) return reject(err);
				resolve(files);
			},
		),
	);

	fs.writeFileSync(dest + "/.prettierrc", "{}", "utf8");

	src = dest;
	dest = path.resolve(__dirname, "../templates/js");

	await new Promise((resolve, reject) =>
		cpr(
			src,
			dest,
			{
				deleteFirst: true,
				filter(filename: string) {
					filename = filename.slice(src.length + 1).replace(/\\/g, "/");
					return !(
						filename.endsWith(".ts") ||
						filename.endsWith(".tsx") ||
						filename === "tsconfig.json" ||
						filename === ".eslintrc.cjs"
					);
				},
			},
			(err, files) => {
				if (err) return reject(err);
				resolve(files);
			},
		),
	);

	// Run detype from src to dst
	await run(`detype ${src} ${dest}`);

	// Remove TypeScript-related things from package.json
	let contents = fs.readFileSync(dest + "/package.json", "utf8");
	contents = contents
		.replace(`npm run test:typecheck && `, "")
		.replace(/^ {4}"test:typecheck": "tsc -p tsconfig.json --noEmit",\r?\n/, "")
		.replace(/^.+(types|typecheck|tsconfig).+$/gm, "")
		.replace(/^\r?\n/gm, "")
		.replace("@rakkasjs/eslint-config", "@rakkasjs/eslint-config-js");

	fs.writeFileSync(dest + "/package.json", contents);

	// Remove TypeScript-related things from vite.config.js
	contents = fs.readFileSync(dest + "/vite.config.js", "utf8");
	contents = contents
		.replace(`tsconfigPaths(), `, "")
		.replace(
			/import tsconfigPaths from "vite-tsconfig-paths";/,
			`import path from "node:path";\n`,
		)
		.replace(
			"plugins",
			`resolve: { alias: { src: path.resolve(__dirname, "src") } },\nplugins`,
		);
	fs.writeFileSync(dest + "/vite.config.js", contents);

	const ESLINT_CONFIG = `require("@rakkasjs/eslint-config-js/patch");
		module.exports = {
		root: true,
		extends: ["@rakkasjs/eslint-config-js"],
		};
	`;

	fs.writeFileSync(dest + "/.eslintrc.cjs", ESLINT_CONFIG, "utf8");
	fs.writeFileSync(dest + "/.prettierrc", "{}", "utf8");

	const JSCONFIG = `{
			"compilerOptions": {
				"paths": {
					"src/*": ["./src/*"]
				}
			}
		}
	`;

	fs.writeFileSync(dest + "/jsconfig.json", JSCONFIG, "utf8");

	await run(`prettier ${dest}/.. --write`);
}
