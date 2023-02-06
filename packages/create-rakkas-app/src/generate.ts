/* eslint-disable no-console */
import { Options } from ".";
import { mkdirp } from "mkdirp";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import cpr from "cpr";
import pico from "picocolors";
import os from "os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function generate(dir: string, options: Options) {
	const manager = getPackageManager() ?? "npm";
	let runCommand = "npm run";

	switch (manager) {
		case "yarn":
			runCommand = "yarn";
			break;
		case "pnpm":
			runCommand = "pnpm";
			break;
		case "bun":
			runCommand = "bun run";
			break;
	}

	await copyFiles(dir, options, runCommand);

	console.log(
		pico.bold(
			"Project generated in " +
				pico.cyan(dir) +
				". Do the following to get started:",
		),
	);

	const commands: [string, string?][] = [];

	if (path.resolve(dir) !== process.cwd()) {
		commands.push([`cd ${dir}`, "Go to the project directory"]);
	}

	commands.push([`${manager} install`, "Install dependencies"]);
	commands.push([`${runCommand} dev`, "Start development server"]);
	commands.push([`${runCommand} build`, "Build for production"]);
	commands.push([`${manager} start`, "Start production server"]);

	// Pad the commands to the same length
	const maxLength = commands.reduce(
		(max, [command]) => Math.max(max, command.length),
		0,
	);
	commands.forEach(([command, description]) => {
		console.log(
			`  ${command.padEnd(maxLength)}  `,
			pico.gray(description ? "# " + description : ""),
		);
	});
}

async function copyFiles(dir: string, options: Options, command: string) {
	await mkdirp(dir);

	const src = path.resolve(
		__dirname,
		options.typescript ? "../templates/ts" : "../templates/js",
	);

	await new Promise((resolve, reject) =>
		cpr(
			src,
			dir,
			{
				deleteFirst: true,
				filter(filename: string) {
					filename = filename.slice(src.length + 1).replace(/\\/g, "/");

					switch (filename) {
						case ".prettierrc":
							return options.prettier;
						case ".eslintrc.cjs":
							return options.eslint;
						case "src/sample.test.ts":
						case "src/sample.test.js":
							return options.vitest;
						case "src/crud.ts":
						case "src/crud.js":
							return options.demo;
						default:
							return options.demo || !filename.startsWith("src/routes/");
					}
				},
			},
			(err, files) => {
				if (err) return reject(err);
				resolve(files);
			},
		),
	);

	const pkg = JSON.parse(
		fs.readFileSync(dir + "/package.json", "utf8"),
	) as DeepPartial<typeof import("../../../examples/todo/package.json")>;

	if (!options.typescript) {
		delete pkg.scripts!["test:typecheck"];
	}

	if (!options.prettier) {
		delete pkg.scripts!["format"];
		delete pkg.scripts!["test:format"];
		delete pkg.devDependencies!.prettier;
	}

	if (!options.eslint) {
		delete pkg.scripts!["test:lint"];
		delete pkg.devDependencies!["eslint"];
		delete pkg.devDependencies!["@rakkasjs/eslint-config"];
		delete (pkg.devDependencies as any)["@rakkasjs/eslint-config-js"];
	}

	if (!options.vitest) {
		delete pkg.scripts!["test:unit"];
		delete pkg.devDependencies!["vitest"];
	}

	const tests = Object.keys(pkg.scripts!).filter((k) => k.startsWith("test:"));

	if (tests.length) {
		pkg.scripts!["test"] = tests
			.map((test) => `${command} ${test}`)
			.join(" && ");
	} else {
		delete pkg.scripts!["test"];
	}

	pkg.name = "-TODO-";

	fs.writeFileSync(
		dir + "/package.json",
		JSON.stringify(pkg, undefined, 2),
		"utf8",
	);

	if (!options.demo) {
		await mkdirp(dir + "/src/routes");
		const fn =
			dir + "/src/routes/index.page." + (options.typescript ? "tsx" : "jsx");
		fs.writeFileSync(fn, BASIC_PAGE.replace(/\n/g, os.EOL), "utf8");
	}
}

const BASIC_PAGE = `export default function HomePage() {
	return (
		<main>
			<h1>Hello world!</h1>
		</main>
	);
}
`;

type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function getPackageManager() {
	// This environment variable is set by npm and yarn but pnpm seems less consistent
	const agent = process.env.npm_config_user_agent;

	if (!agent) {
		// This environment variable is set on Linux but I'm not sure about other OSes.
		const parent = process.env._;

		if (!parent) {
			// No luck
			return null;
		}

		if (parent.endsWith("pnpx") || parent.endsWith("pnpm")) return "pnpm";
		if (parent.endsWith("yarn")) return "yarn";
		if (parent.endsWith("npx") || parent.endsWith("npm")) return "npm";
		if (parent.endsWith("bun")) return "bun";

		return null;
	}

	const [program] = agent.split("/");

	if (program === "yarn") return "yarn";
	if (program === "pnpm") return "pnpm";
	if (program === "bun") return "bun";

	return "npm";
}
