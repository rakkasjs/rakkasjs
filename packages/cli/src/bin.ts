#!/usr/bin/env node

import { program, Command } from "commander";

import devCommand from "./commands/dev";
import buildCommand from "./commands/build";
import { loadConfig } from "./lib/config";
import withPortCommand from "./commands/with-port";

async function main() {
	const packageJson = await readPackageJson();
	parseCommandLineArguments(packageJson.version);
}

async function readPackageJson() {
	return await import("../package.json");
}

function parseCommandLineArguments(version: string) {
	program.name("rakkas");
	program.version(version);

	program.addCommand(devCommand());
	program.addCommand(buildCommand());
	program.addCommand(withPortCommand());

	program.addCommand(
		new Command("print-config")
			.description("Print configuration")
			.action(async () => {
				const { config } = await loadConfig();
				// eslint-disable-next-line no-console
				console.log(config);
			}),
	);

	return program.parse();
}

main().catch((error) => {
	// eslint-disable-next-line no-console
	console.error(error);
});
