#!/usr/bin/env node
import { program, Option } from "commander";
import which from "which";
import * as fancy from "./fancy-interface";
import * as simple from "./simple-interface";

export let version = "";

async function main() {
	const packageJson = await import("../package.json");
	version = packageJson.version;
	parseCommandLineArguments();
}

function parseCommandLineArguments() {
	const pnpmAvailable = !!which.sync("pnpm", { nothrow: true });
	const yarnAvailable = !!which.sync("yarn", { nothrow: true });
	const ttyin = process.stdin.isTTY;
	const ttyout = process.stdout.isTTY;

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
			"-i, --interactive-input",
			"enable interactive input even when stdin is redirected",
		)
		.option(
			"-c, --color-output",
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
				const availablePackageManagers = [
					"npm",
					yarnAvailable && "yarn",
					pnpmAvailable && "pnpm",
				].filter(Boolean) as Array<"npm" | "yarn" | "pnpm">;

				let unavailable: string | undefined;
				if (
					packageManager &&
					!availablePackageManagers.includes(packageManager)
				) {
					unavailable = packageManager;
					packageManager = undefined;
				}

				packageManager =
					packageManager || pnpmAvailable
						? "pnpm"
						: yarnAvailable
						? "yarn"
						: "npm";

				if (unavailable) {
					process.stderr.write(
						`Requested package manager ${unavailable} is not available on the path. Defaulting to ${packageManager}\n`,
					);
				}

				interactiveInput = !!(interactiveInput || ttyin);
				colorOutput = !!(colorOutput || ttyout);

				const completeFeatures = {
					typescript: !no,
					jest: !no,
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

				if (!yes && !no) {
					options = await (interactiveInput
						? fancy.getOptions(defaults)
						: simple.getOptions(defaults));
				}

				await (colorOutput
					? fancy.runGenerate(options, version)
					: simple.runGenerate(options, version));

				return;
			},
		);

	return program.parse();
}

main().catch((error) => {
	// eslint-disable-next-line no-console
	console.error(error);
});
