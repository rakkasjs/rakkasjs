import { Options } from "./interfaces";
import fs from "fs";
import path from "path";
import cpr from "cpr";
import { spawn } from "child_process";

export interface GenerationInfo {
	version: string;
	startStep(step: string): void;
	runCommand(command: string): Promise<number>;
}

export async function generate(opts: Options, info: GenerationInfo) {
	const template = opts.features.typescript ? "ts" : "js";
	const templateDir = path.resolve(__dirname, "templates", template);

	info.startStep("Copying files");
	await new Promise<void>((resolve, reject) => {
		cpr(
			templateDir,
			".",
			{
				filter(fullname: string) {
					const name = fullname.slice(templateDir.length + 1);

					switch (name) {
						case "jest.config.json":
						case "src/jest-setup.js":
						case "src/jest-setup.ts":
							return opts.features.jest;

						case ".eslintrc.json":
							return opts.features.eslint;

						case ".stylelintrc.json":
							return opts.features.stylelint;

						case ".prettierignore":
							return opts.features.prettier;
					}

					if (!opts.features.jest && name.includes(".test.")) return false;

					return true;
				},
			},
			(error) => {
				if (error) reject(error);
				resolve();
			},
		);
	});

	info.startStep("Updating files");
	// Update package.json
	const pkg: {
		name: string;
		version: string;
		scripts: Record<string, string>;
		dependencies: Record<string, string>;
		devDependencies: Record<string, string>;
	} = JSON.parse(
		await fs.promises.readFile("package.json", { encoding: "utf8" }),
	);

	// Update package JSON
	pkg.name = "--TODO--";
	pkg.version = "0.0.1";

	for (const [k, v] of Object.entries(pkg.dependencies || {})) {
		if (v.startsWith("workspace:")) pkg.dependencies![k] = info.version;
	}

	for (const [k, v] of Object.entries(pkg.devDependencies || {})) {
		if (v.startsWith("workspace:")) pkg.devDependencies![k] = info.version;

		if (!opts.features.jest) {
			if (
				k.includes("jest") ||
				k.includes("esbuild") ||
				k.includes("testing-library")
			) {
				delete pkg.devDependencies![k];
			}
		}

		if (k.includes("eslint") && !opts.features.eslint) {
			delete pkg.devDependencies![k];
		}

		if (k.includes("stylelint") && !opts.features.stylelint) {
			delete pkg.devDependencies![k];
		}

		if (k.includes("eslint") && !opts.features.prettier) {
			delete pkg.devDependencies![k];
		}
	}

	if (!opts.features.jest) {
		delete pkg.scripts.test;
	}

	if (!opts.features.eslint) {
		delete pkg.scripts["lint:ts"];
		delete pkg.scripts["lint:js"];
	}

	if (!opts.features.stylelint) {
		delete pkg.scripts["lint:css"];
	}

	if (!opts.features.prettier) {
		delete pkg.scripts.format;
	}

	await fs.promises.writeFile(
		"package.json",
		JSON.stringify(pkg, undefined, 2),
	);

	if (!opts.features.prettier) {
		// Remove prettier from lint config related files

		if (opts.features.eslint) {
			const cfg: {
				extends: string[];
			} = JSON.parse(
				await fs.promises.readFile(".eslintrc.json", {
					encoding: "utf8",
				}),
			);

			cfg.extends = cfg.extends.filter((x) => x !== "prettier");

			await fs.promises.writeFile(
				".eslintrc.json",
				JSON.stringify(cfg, undefined, "\t"),
			);
		}

		if (opts.features.eslint) {
			const cfg: {
				extends: string[];
			} = JSON.parse(
				await fs.promises.readFile(".stylelintrc.json", {
					encoding: "utf8",
				}),
			);

			cfg.extends = cfg.extends.filter((x) => x !== "prettier");

			await fs.promises.writeFile(
				".stylelintrc.json",
				JSON.stringify(cfg, undefined, "\t"),
			);
		}
	}

	if (opts.features.typescript && !opts.features.jest) {
		// Remove jest typings
		const cfg: {
			compilerOptions: {
				types: string[];
			};
		} = JSON.parse(
			await fs.promises.readFile("tsconfig.json", {
				encoding: "utf8",
			}),
		);

		cfg.compilerOptions.types = cfg.compilerOptions.types.filter(
			(x) => x !== "jest" && x !== "@testing-library/jest-dom",
		);

		await fs.promises.writeFile(
			"tsconfig.json",
			JSON.stringify(cfg, undefined, "\t"),
		);
	}

	info.startStep("Installing dependencies");

	const pmExitCode = await info.runCommand(opts.packageManager + " install");

	if (pmExitCode) {
		throw new Error(
			opts.packageManager + " install returned a non-zero exit code",
		);
	}

	if (opts.features.prettier) {
		// Create a prettier config file
		const { exitCode, stdout } = await runCommandAndCollectOutput(
			path.join("node_modules", ".bin", "/prettier") + " --find-config-path .",
		);

		if (!exitCode && stdout) {
			const prettierConfigFile = stdout.trim();

			info.startStep(
				`Copying prettier config from ${path.resolve(prettierConfigFile)}`,
			);
			await fs.promises.copyFile(
				prettierConfigFile,
				path.basename(prettierConfigFile),
			);
		} else {
			info.startStep("Creating .prettierrc");
			await fs.promises.writeFile(".prettierrc", "{}");
		}

		info.startStep("Running prettier");
		const prettierExitCode = await info.runCommand(
			opts.packageManager + " run format",
		);

		if (prettierExitCode) {
			throw new Error("prettier returned a non-zero exit code");
		}
	}
}

interface CommandResult {
	exitCode: number;
	stderr: string;
	stdout: string;
}

async function runCommandAndCollectOutput(command: string) {
	return new Promise<CommandResult>((resolve, reject) => {
		const spawned = spawn(command, {
			stdio: ["ignore", "pipe", "pipe"],
			shell: true,
		});

		spawned.on("error", reject);

		let stdout = "";
		let stderr = "";

		spawned.stdout.setEncoding("utf-8");
		spawned.stdout.on("data", (s) => (stdout += s));

		spawned.stderr.setEncoding("utf-8");
		spawned.stderr.on("data", (s) => (stderr += s));

		spawned.on("exit", (exitCode) =>
			resolve({
				exitCode: exitCode || 0,
				stdout,
				stderr,
			}),
		);
	});
}
