#!/usr/bin/env node
import { program, Option } from "commander";
import which from "which";
import fs from "fs";
import * as fancy from "./fancy-interface";
import * as simple from "./simple-interface";

export let version = "";

async function main() {
	const packageJson = await import("../package.json");
	version = packageJson.version;
	parseCommandLineArguments();
}

function parseCommandLineArguments() {
	const ttyin = process.stdin.isTTY;
	const ttyout = process.stdout.isTTY;

	const pnpmAvailable = !!which.sync("pnpm", { nothrow: true });
	const yarnAvailable = !!which.sync("yarn", { nothrow: true });
	const availablePackageManagers = [
		"npm",
		yarnAvailable && "yarn",
		pnpmAvailable && "pnpm",
	].filter(Boolean) as Array<"npm" | "yarn" | "pnpm">;

	program
		.name("create-rakkas-app")
		.version(version)
		.description("Generate a Rakkas project")
		.addOption(
			new Option(
				"-P, --package-manager <packageManager>",
				"package manager to use",
			).choices(availablePackageManagers),
		)
		.option("-t, --typescript", "enable TypeScript support")
		.option("--no-typescript", "disable TypeScript support")
		.option("-j, --jest", "enable unit testing with Jest")
		.option("--no-jest", "disable unit testing with Jest")
		.option("-a, --api", "enable end-to-end API testing with Jest")
		.option("--no-api", "disable end-to-end API testing with Jest")
		.option("-c, --cypress", "enable end-to-end browser testing with Cypress")
		.option("--no-cypress", "disable end-to-end browser testing with Cypress")
		.option("-e, --eslint", "enable JavaScript/TypeScript linting with ESLint")
		.option("--no-eslint", "disable JavaScript/TypeScript linting with ESLint")
		.option("-s, --stylelint", "enable CSS linting with Stylelint")
		.option("--no-stylelint", "disable CSS linting with Stylelint")
		.option("-p, --prettier", "enable code formatting with Prettier")
		.option("--no-prettier", "disable code formatting with Prettier")
		.option(
			"-i, --interactive-input",
			"enable interactive input even when stdin is redirected",
		)
		.option(
			"--color-output",
			"enable color output even when stdout is redirected",
		)
		.option(
			"-y, --yes",
			"don't show the promt and generate with all features except what's specifically disabled",
		)
		.option(
			"-n, --no",
			"don't show the promt and generate with no features except what's specifically enabled",
		)
		.action(
			async ({
				yes,
				no,
				interactiveInput,
				colorOutput,
				packageManager,
				...features
			}: {
				packageManager?: "npm" | "yarn" | "pnpm";
				typescript?: boolean;
				jest?: boolean;
				eslint?: boolean;
				stylelint?: boolean;
				prettier?: boolean;
				interactiveInput?: boolean;
				colorOutput?: boolean;
				yes?: boolean;
				no?: boolean;
			}) => {
				const files = await fs.promises.readdir(".");
				if (files.length) {
					process.stderr.write(
						"Refusing to generate project: Directory not empty.\n",
					);
					process.exit(1);
				}

				packageManager = getPackageManager();

				if (
					(packageManager === "pnpm" && !pnpmAvailable) ||
					(packageManager === "yarn" && !yarnAvailable)
				)
					packageManager = "npm";

				interactiveInput = !!(interactiveInput || ttyin);
				colorOutput = !!(colorOutput || ttyout);

				const completeFeatures = {
					demo: !no,
					typescript: !no,
					jest: !no,
					api: !no,
					cypress: !no,
					eslint: !no,
					stylelint: !no,
					prettier: !no,
					...features,
				};

				let options = {
					packageManager,
					features: completeFeatures,
				};

				const defaults = {
					availablePackageManagers,
					defaults: options,
				};

				try {
					if (!yes && !no) {
						options = await (interactiveInput
							? fancy.getOptions(defaults)
							: simple.getOptions(defaults));
					}

					await (colorOutput
						? fancy.runGenerate(options, version)
						: simple.runGenerate(options, version));
				} catch {
					// Probably just Ctrl+C
				}
				return;
			},
		);

	return program.parse();
}

function getPackageManager() {
	// This environment variable is set by npm and yarn but pnpm seems less consistent
	const agent = process.env.npm_config_user_agent;

	if (!agent) {
		// This environment variable is set on Linux but I'm not sure about other OSes.
		const parent = process.env._;

		if (!parent) {
			// No luck, assume npm
			return "npm";
		}

		if (parent.endsWith("pnpx") || parent.endsWith("pnpm")) return "pnpm";
		if (parent.endsWith("yarn")) return "yarn";

		// Assume npm for anything else
		return "npm";
	}

	const [program] = agent.split("/");

	if (program === "yarn") return "yarn";
	if (program === "pnpm") return "pnpm";

	// Assume npm
	return "npm";
}

main().catch((error) => {
	// eslint-disable-next-line no-console
	console.error(error);
});
