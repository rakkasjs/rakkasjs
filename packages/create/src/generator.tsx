import React, { FC, useState, useEffect } from "react";
import { Text } from "ink";
import Spinner from "ink-spinner";
import cpr from "cpr";
import path from "path";
import fs from "fs";
import { spawn, SpawnOptions } from "child_process";
import { FormValue, unmountForm } from "./form";
import { version } from ".";

export const Generator: FC<FormValue> = (opts) => {
	const [steps, setSteps] = useState(["Copying files"]);
	const [errorOutput, setErrorOutput] = useState("");
	const [done, setDone] = useState(false);
	const [error, setError] = useState(false);

	function addStep(step: string) {
		setSteps((old) => [...old, step]);
	}

	useEffect(() => {
		async function generateProject() {
			const template = opts.features.typescript ? "ts" : "js";
			const templateDir = path.resolve(__dirname, "templates", template);
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
				async (err) => {
					if (err) {
						const message =
							err instanceof Error
								? err.message
								: "An unknown error has occured";

						setErrorOutput("Could not copy files: " + message);
						setError(true);
						return;
					}

					try {
						// Update package.json
						const pkg: {
							version: string;
							scripts: Record<string, string>;
							dependencies: Record<string, string>;
							devDependencies: Record<string, string>;
						} = JSON.parse(
							await fs.promises.readFile("package.json", { encoding: "utf8" }),
						);

						// Update package JSON
						pkg.version = "0.0.1";

						for (const [k, v] of Object.entries(pkg.dependencies || {})) {
							if (v.startsWith("workspace:")) pkg.dependencies![k] = version;
						}

						for (const [k, v] of Object.entries(pkg.devDependencies || {})) {
							if (v.startsWith("workspace:")) pkg.devDependencies![k] = version;

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
					} catch (err) {
						const message =
							err instanceof Error
								? err.message
								: "An unknown error has occured";

						setErrorOutput("Could not update package files: " + message);
						setError(true);
						return;
					}

					addStep("Installing dependencies");

					try {
						const pmExitCode = await runCommand(
							opts.packageManager + " install",
							{ onStderr: (s) => setErrorOutput((old) => old + s) },
						);

						if (pmExitCode) {
							throw new Error(
								opts.packageManager + " install returned a non-zero exit code",
							);
						}
					} catch (err) {
						const message =
							err && err.message && typeof err.message === "string"
								? err.message
								: "Unkown error";
						setErrorOutput("Could not install dependencies: " + message);
						setError(true);
					}

					if (opts.features.prettier) {
						try {
							// Create a prettier config file
							const { exitCode, stdout } = await runCommandAndCollectOutput(
								path.join("node_modules", ".bin", "/prettier") +
									" --find-config-path .",
								{},
							);

							if (!exitCode && stdout) {
								const prettierConfigFile = stdout.trim();

								addStep(
									`Copying prettier config from ${path.resolve(
										prettierConfigFile,
									)}`,
								);
								await fs.promises.copyFile(
									prettierConfigFile,
									path.basename(prettierConfigFile),
								);
							} else {
								addStep("Creating .prettierrc");
								await fs.promises.writeFile(".prettierrc", "{}");
							}

							addStep("Running prettier");
							const prettierExitCode = await runCommand(
								opts.packageManager + " run format",
								{ onStderr: (s) => setErrorOutput((old) => old + s) },
							);

							if (prettierExitCode) {
								throw new Error("prettier returned a non-zero exit code");
							}
						} catch (err) {
							const message =
								err && err.message && typeof err.message === "string"
									? err.message
									: "Unkown error";
							setErrorOutput("Could not run prettier: " + message);
							setError(true);
						}
					}

					setDone(true);
				},
			);
		}

		generateProject();
	}, []);

	const lastStep = steps[steps.length - 1];

	useEffect(() => {
		if (error) unmountForm();
	}, [error]);

	return (
		<>
			<Text> </Text>
			{steps.map((step) => (
				<Text
					key={step}
					color={step === lastStep && !done ? "whiteBright" : undefined}
				>
					{step === lastStep && !done && !error ? (
						<Text color="yellow">
							<Spinner />
						</Text>
					) : step === lastStep && error ? (
						<Text color="redBright">✗</Text>
					) : (
						<Text color="green">✓</Text>
					)}{" "}
					{step}
				</Text>
			))}
			{errorOutput ? (
				<Text color={error ? "redBright" : "gray"}>{errorOutput}</Text>
			) : null}
			{done && (
				<Done
					pmRun={
						opts.packageManager === "npm" ? "npm run" : opts.packageManager
					}
					pmStart={opts.packageManager + " start"}
				/>
			)}
		</>
	);
};

const Done: FC<{ pmRun: string; pmStart: string }> = ({ pmRun, pmStart }) => {
	useEffect(() => {
		unmountForm();
	});

	const lines = [
		[`    ${pmRun} dev`, "Start development server"],
		[`    ${pmRun} build`, "Build for production"],
		[`    ${pmStart}`, "Start production server"],
	];

	const longest = Math.max(...lines.map(([c]) => c.length));
	lines.map((x, i) => (lines[i][0] = x[0].padEnd(longest + 1)));

	return (
		<>
			<Text>
				{"\n"}Rakkas demo project is ready. Now you can run the following
				commands:
			</Text>
			{lines.map(([code, comment], i) => (
				<Text key={i} color="whiteBright">
					{code} <Text color="gray"> # {comment}</Text>
				</Text>
			))}
			<Text> </Text>
		</>
	);
};

interface RunOptions extends SpawnOptions {
	onStdout?(s: string): void;
	onStderr?(s: string): void;
}

async function runCommand(command: string, options: RunOptions) {
	return new Promise((resolve, reject) => {
		const { onStdout, onStderr, ...spawnOptions } = options;
		const pm = spawn(command, {
			...spawnOptions,
			stdio: [
				"ignore",
				onStdout ? "pipe" : "ignore",
				onStderr ? "pipe" : "ignore",
			],
			shell: true,
		})
			.on("error", (err) => {
				reject(err);
			})
			.on("exit", () => {
				resolve(pm.exitCode);
			});

		if (onStdout) {
			pm.stdout!.setEncoding("utf-8");
			pm.stdout!.on("data", (chunk: string) => {
				onStdout(chunk);
			});
		}

		if (onStderr) {
			pm.stderr!.setEncoding("utf-8");
			pm.stderr!.on("data", (chunk: string) => {
				onStderr(chunk);
			});
		}
	});
}

async function runCommandAndCollectOutput(
	command: string,
	options?: SpawnOptions,
) {
	let stdout = "";
	let stderr = "";

	const exitCode = await runCommand(command, {
		...options,
		onStdout: (s) => (stdout += s),
		onStderr: (s) => (stderr += s),
	});

	return {
		exitCode,
		stdout,
		stderr,
	};
}
