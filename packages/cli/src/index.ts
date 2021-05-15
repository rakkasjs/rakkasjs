#!/usr/bin/env node

import path from "path";
import fs from "fs";
import { program } from "commander";

import devCommand from "./dev";

async function main() {
	const packageJson = await readPackageJson();
	parseCommandLineArguments(packageJson.version);
}

async function readPackageJson() {
	const packageJsonFileName = path.resolve(
		path.dirname(process.argv[1]),
		"../package.json",
	);
	const content = await fs.promises.readFile(packageJsonFileName, {
		encoding: "utf-8",
	});
	return JSON.parse(content);
}

function parseCommandLineArguments(version: string) {
	program.name("rakkas");
	program.version(version);

	program.addCommand(devCommand());

	return program.parse();
}

main().catch((error) => {
	console.error(error);
});
