#!/usr/bin/env node
import { program, Option } from "commander";
import which from "which";
import { renderForm } from "./form";

export let version = "";

async function main() {
	const packageJson = await import("../package.json");
	version = packageJson.version;
	parseCommandLineArguments();
}

function parseCommandLineArguments() {
	const pnpmAvailable = !!which.sync("pnpm", { nothrow: true });
	const yarnAvailable = !!which.sync("yarn", { nothrow: true });

	program
		.name("npm init @rakkasjs")
		.version(version)
		.description("Generate a Rakkas project")
		.addOption(
			new Option(
				"-P, --package-manager <packageManager>",
				"package manager to use",
			).choices(["npm", "yarn", "pnpm"]),
		)
		.option("-t, --typescript", "enable TypeScript support")
		.option("--no-typescript", "disable TypeScript support")
		.option("-j, --jest", "enable Jest support")
		.option("--no-jest", "disable Jest support")
		.option("-e, --eslint", "enable ESLint support")
		.option("--no-eslint", "disable ESLint support")
		.option("-s, --stylelint", "enable Stylelint support")
		.option("--no-stylelint", "disable Stylelint support")
		.option("-p, --prettier", "enable Prettier support")
		.option("--no-prettier", "disable Prettier support")
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
				...opts
			}: {
				packageManager?: "npm" | "yarn" | "pnpm";
				typescript?: boolean;
				jest?: boolean;
				eslint?: boolean;
				stylelint?: boolean;
				prettier?: boolean;
				yes?: boolean;
				no?: boolean;
			}) => {
				if (no) {
					opts = Object.assign(
						{
							typescript: false,
							jest: false,
							eslint: false,
							stylelint: false,
							prettier: false,
						},
						opts,
					);
				}
				renderForm({
					pnpmAvailable,
					yarnAvailable,
					...opts,
					noPrompt: yes || no,
				});
			},
		);

	return program.parse();
}

main().catch((error) => {
	// eslint-disable-next-line no-console
	console.error(error);
});
