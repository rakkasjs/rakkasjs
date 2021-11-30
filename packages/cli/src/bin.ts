#!/usr/bin/env node

import commander from "commander";
import devCommand from "./commands/dev";
import buildCommand from "./commands/build";
import withPortCommand from "./commands/with-port";

const { program } = commander;

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

	return program.parse();
}

main().catch((error) => {
	// eslint-disable-next-line no-console
	console.error(error);
});
