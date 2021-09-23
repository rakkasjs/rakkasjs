import { Options, Defaults } from "./interfaces";
import readline from "readline";
import { generate } from "./generate";
import { spawn } from "child_process";

export async function getOptions({
	availablePackageManagers,
	defaults: { packageManager, features },
}: Defaults): Promise<Options> {
	const rli = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	function getString(prompt: string) {
		return new Promise<string>((resolve) => {
			rli.question(prompt, resolve);
		});
	}

	async function ask(
		prompt: string,
		defaultValue = "",
		onValidate?: (value: string) => string | undefined,
	) {
		const completePrompt = defaultValue
			? `${prompt} [${defaultValue}]: `
			: `${prompt}: `;

		for (;;) {
			let answer = await getString(completePrompt);
			if (!answer) answer = defaultValue;
			if (onValidate) {
				const error = onValidate(answer);
				if (error) {
					process.stderr.write(error + "\n");
					continue;
				}
			}

			return answer;
		}
	}

	process.stdout.write(
		"Interactive input mode is not available. Using basic prompts.\n\n",
	);

	process.stdout.write(
		availablePackageManagers.map((p, i) => `${i + 1}. ${p}\n`).join(""),
	);

	let pm = packageManager;

	if (availablePackageManagers.length > 1) {
		pm = (await ask("Package manager", packageManager, (answer) => {
			if ((availablePackageManagers as string[]).includes(answer)) return;

			const n = Number(answer);
			if (n > 0 && n <= availablePackageManagers.length) return;

			return "Please enter a valid choice";
		})) as typeof packageManager;
	}

	if (!availablePackageManagers.includes(pm)) {
		pm = availablePackageManagers[Number(pm) - 1];
	}

	const featurePrompts = [
		{ message: "Demo app", name: "demo" },
		{ message: "TypeScript", name: "typescript" },
		{ message: "Unit testing with jest", name: "jest" },
		{ message: "End-to-end API testing with jest", name: "api" },
		{
			message: "End-to-end browser testing with cypress",
			name: "cypress",
		},
		{
			message: "ESLint for linting JavaScript/TypeScript",
			name: "eslint",
		},
		{ message: "Stylelint for linting CSS", name: "stylelint" },
		{ message: "Prettier for code formatting", name: "prettier" },
	] as const;

	const confirmedFeatures = { ...features };

	// eslint-disable-next-line no-console
	console.log("\nOptional features to enable");

	for (const { message, name } of featurePrompts) {
		const enable = await ask(message, features[name] ? "yes" : "no", (answer) =>
			["y", "ye", "yes", "n", "no"].includes(answer.toLowerCase())
				? undefined
				: "Please enter a valid choice",
		);

		confirmedFeatures[name] = ["y", "ye", "yes"].includes(enable.toLowerCase());
	}

	// eslint-disable-next-line no-console
	console.log();

	return {
		packageManager: pm as typeof packageManager,
		features: confirmedFeatures,
	};
}

export async function runGenerate(opts: Options, version: string) {
	try {
		await generate(opts, {
			version,
			startStep(step) {
				process.stdout.write("- " + step + "...\n");
			},
			runCommand(command) {
				return new Promise<number>((resolve, reject) => {
					const spawned = spawn(command, {
						stdio: "inherit",
						shell: true,
					});

					spawned.on("error", reject);

					spawned.on("exit", (exitCode) => resolve(exitCode || 0));
				});
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		process.stderr.write("\nProject generation failed: " + message + "\n");
		process.exit(1);
	}
	process.stdout.write("Done! Try following commands to start:\n");
	process.stdout.write(
		`${opts.packageManager} run dev   # Start a development server\n` +
			`${opts.packageManager} run build # Build for production\n` +
			`${opts.packageManager} start     # Start the production server\n`,
	);
}
