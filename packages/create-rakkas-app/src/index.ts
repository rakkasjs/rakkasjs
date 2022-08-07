/* eslint-disable no-console */
import { cac } from "cac";
import { version } from "../package.json";
import inquirer from "inquirer";
import pico from "picocolors";
import { generate } from "./generate";
import fs from "fs";

const cli = cac("create-rakkas-app");

export interface Options {
	skipPrompt?: boolean;
	force?: boolean;

	typescript?: boolean;
	prettier?: boolean;
	eslint?: boolean;
	vitest?: boolean;
	demo?: boolean;
}

cli
	.command("[dir]", "Create Rakkas application boilerplate")
	.option("-y, --skip-prompt", "[boolean] Skip the prompt")
	.option(
		"-f, --force",
		"[boolean] Generate even if the directory is not empty",
	)
	.option("-t, --typescript", "[boolean] Use TypeScript for static typing", {
		default: true,
	})
	.option("-p, --prettier", "[boolean] Use Prettier for code formatting", {
		default: true,
	})
	.option(
		"-e, --eslint",
		"[boolean] Use ESLint for linting JavaScript/TypeScript",
		{ default: true },
	)
	.option("-v, --vitest", "[boolean] Use Vitest for unit testing", {
		default: true,
	})
	.option("-d, --demo", "[boolean] Generate demo todo app", { default: true })
	.action(async (dir = ".", options: Options) => {
		console.log(
			pico.black(pico.bgMagenta(" RAKKAS ")) +
				" " +
				pico.magenta(version) +
				" 💃",
		);

		if (!options.force && fs.existsSync(dir)) {
			const files = await fs.promises.readdir(dir);
			if (files.length) {
				throw new Error("Directory is not empty");
			}
		}

		if (!options.skipPrompt) {
			await prompt(options);
		}

		await generate(dir, options);
	});

cli.help((s) => {
	s.splice(3, 1);

	s[0].body =
		pico.black(pico.bgMagenta(" RAKKAS ")) +
		" " +
		pico.magenta(version) +
		" 💃";

	s[1].body = "  $ create-rakkas-app [dir] [...options]";
	s[2] = s[1];

	s[1] = {
		body: "Generate Rakkas application boiler plate",
	};

	s.push({
		body: "All features are enabled when using the -y option. Use, e.g., --no-typescript to opt out of a feature.",
	});
});

cli.version(version);

cli.parse();

async function prompt(options: Options) {
	const answers = await inquirer.prompt([
		{
			type: "checkbox",
			name: "features",
			message: "Enable features",
			pageSize: Infinity,
			choices: [
				{
					name: " TypeScript for static typing",
					short: "TypeScript",
					value: "typescript",
					checked: options.typescript,
				},
				{
					name: " Prettier for code formatting",
					short: "Prettier",
					value: "prettier",
					checked: options.prettier,
				},
				{
					name: " ESLint for linting JavaScript/TypeScript",
					short: "ESLint",
					value: "eslint",
					checked: options.eslint,
				},
				{
					name: " Vitest for unit testing",
					short: "Vitest",
					value: "vitest",
					checked: options.vitest,
				},
				{
					name: " Demo todo app",
					short: "Demo",
					value: "demo",
					checked: options.demo,
				},
			],
		},
	]);

	options.typescript = answers.features.includes("typescript");
	options.prettier = answers.features.includes("prettier");
	options.eslint = answers.features.includes("eslint");
	options.vitest = answers.features.includes("vitest");
	options.demo = answers.features.includes("demo");
}
