#!/usr/bin/env node

import path from "path";
import fs from "fs";
import { program, Command } from "commander";

import devCommand from "./commands/dev";
import buildCommand from "./commands/build";
import exportCommand from "./commands/export";
import { loadConfig } from "./lib/config";

async function main() {
	const packageJson = await readPackageJson();
	parseCommandLineArguments(packageJson.version);
}

async function readPackageJson() {
	const packageJsonFileName = path.resolve(__dirname, "../package.json");
	const content = await fs.promises.readFile(packageJsonFileName, {
		encoding: "utf-8",
	});
	return JSON.parse(content);
}

function parseCommandLineArguments(version: string) {
	program.name("rakkas");
	program.version(version);

	program.addCommand(devCommand());
	program.addCommand(buildCommand());
	program.addCommand(exportCommand());

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
