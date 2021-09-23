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
	const ft = opts.features;

	const template = ft.typescript ? "ts" : "js";
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
						case "src/server.js":
						case "src/server.ts":
						case "src/client.js":
						case "src/client.ts":
							return ft.demo;

						case "jest.config.json":
						case "src/jest-setup.js":
						case "src/jest-setup.ts":
							return ft.jest;

						case "jest-api-test.config.json":
							return ft.api;

						case ".eslintrc.json":
							return ft.eslint;

						case ".stylelintrc.json":
							return ft.stylelint;

						case ".prettierignore":
							return ft.prettier;
					}

					if (!ft.demo) {
						if (
							name.startsWith("src/pages/") ||
							name.startsWith("src/api/") ||
							name === "src/api"
						) {
							return (
								name === "src/pages/no-demo-page.tsx" ||
								name === "src/pages/no-demo-page.jsx"
							);
						}
					}

					if (
						ft.demo &&
						(name === "src/pages/no-demo-page.tsx" ||
							name === "src/pages/no-demo-page.jsx")
					)
						return false;

					if (!ft.jest && name.startsWith("src/") && name.includes(".test."))
						return false;

					if (!ft.api && name.startsWith("api-test/")) return false;

					if (!ft.cypress && name.includes("cypress")) return false;

					return true;
				},
			},

			(error) => {
				if (error) reject(error);
				resolve();
			},
		);
	});

	if (!ft.demo) {
		const ext = ft.typescript ? ".tsx" : ".jsx";

		const demoPage = "src/pages/no-demo-page" + ext;

		await fs.promises.rename(demoPage, "src/pages/page" + ext);
	}

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

	if (!ft.jest) {
		delete pkg.devDependencies["@testing-library/jest-dom"];
		delete pkg.devDependencies["@types/testing-library__jest-dom"];
		delete pkg.devDependencies["jest-css-modules-transform"];
	}

	if (!ft.cypress) {
		delete pkg.devDependencies["cypress"];
	}

	if (!ft.api && !ft.cypress) {
		delete pkg.devDependencies["start-server-and-test"];
	}

	for (const [k, v] of Object.entries(pkg.devDependencies || {})) {
		if (v.startsWith("workspace:")) pkg.devDependencies![k] = info.version;

		if (!ft.jest && !ft.api) {
			if (
				k.includes("jest") ||
				k.includes("esbuild") ||
				k.includes("testing-library")
			) {
				delete pkg.devDependencies![k];
			}
		}

		if (!ft.api && k.includes("node-fetch")) {
			delete pkg.devDependencies![k];
		}

		if (k.includes("eslint") && !ft.eslint) {
			delete pkg.devDependencies![k];
		}

		if (k.includes("stylelint") && !ft.stylelint) {
			delete pkg.devDependencies![k];
		}

		if (k.includes("eslint") && !ft.prettier) {
			delete pkg.devDependencies![k];
		}
	}

	const checks = [
		(ft.eslint || ft.stylelint) && "'lint:*'",
		ft.typescript && "typecheck",
		(ft.jest || ft.api || ft.cypress) && "'test:*'",
	].filter(Boolean) as string[];

	if (!checks.length) {
		delete pkg.scripts.check;
		delete pkg.devDependencies["npm-run-all"];
	} else {
		pkg.scripts.check = "run-p " + checks.join(" ");
	}

	if (!ft.jest && !ft.api && !ft.api) {
		delete pkg.scripts.test;
	}

	if (!ft.jest) {
		delete pkg.scripts["test:unit"];
	}

	if (!ft.api && !ft.cypress) {
		delete pkg.scripts["test:e2e"];
	}

	if (!ft.api) {
		delete pkg.scripts["test:e2e:api"];
	}

	if (!ft.cypress) {
		delete pkg.scripts["test:e2e:browser"];
	}

	if (!ft.eslint && !ft.stylelint) {
		delete pkg.scripts["lint"];
	}

	if (!ft.eslint) {
		delete pkg.scripts["lint:ts"];
		delete pkg.scripts["lint:js"];
	}

	if (!ft.stylelint) {
		delete pkg.scripts["lint:css"];
	}

	if (!ft.prettier) {
		delete pkg.scripts.format;
	}

	await fs.promises.writeFile(
		"package.json",
		JSON.stringify(pkg, undefined, 2),
	);

	if (!ft.prettier) {
		// Remove prettier from lint config related files

		if (ft.eslint) {
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

		if (ft.eslint) {
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

	if (ft.typescript && (!ft.jest || !ft.api)) {
		// Remove jest typings
		const cfg: {
			compilerOptions: {
				types: string[];
			};
			include?: string[];
		} = JSON.parse(
			await fs.promises.readFile("tsconfig.json", {
				encoding: "utf8",
			}),
		);

		if (!ft.jest) {
			const filter = ft.api
				? (x: string) => x !== "@testing-library/jest-dom"
				: (x: string) => x !== "jest" && x !== "@testing-library/jest-dom";

			cfg.compilerOptions.types = cfg.compilerOptions.types.filter(filter);
		}

		await fs.promises.writeFile(
			"tsconfig.json",
			JSON.stringify(cfg, undefined, "\t"),
		);
	}

	info.startStep("Installing dependencies (this may take a while)");

	const pmExitCode = await info.runCommand(opts.packageManager + " install");

	if (pmExitCode) {
		throw new Error(
			opts.packageManager + " install returned a non-zero exit code",
		);
	}

	if (ft.prettier) {
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
