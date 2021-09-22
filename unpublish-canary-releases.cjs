const { spawn } = require("child_process");

function runAndGetOutput(command) {
	const spawned = spawn(command, { shell: true, stdio: "pipe" });

	let output = "";

	spawned.stdout.setEncoding("utf-8");

	spawned.stdout.on("data", (chunk) => {
		output += chunk;
	});

	return new Promise((resolve, reject) => {
		spawned.on("exit", (code) => {
			if (code) {
				reject(new Error("Command failed: " + command));
			} else {
				resolve(output);
			}
		});

		spawned.on("error", (error) => {
			reject(error);
		});
	});
}

function run(command) {
	const spawned = spawn(command, { shell: true, stdio: "inherit" });

	return new Promise((resolve, reject) => {
		spawned.on("exit", (code) => {
			if (code) {
				reject(new Error("Command failed: " + command));
			} else {
				resolve();
			}
		});

		spawned.on("error", (error) => {
			reject(error);
		});
	});
}

async function main() {
	const output = await runAndGetOutput(
		`pnpm -r exec -- node -e "require('./package.json').private || console.log(require('./package.json').name)"`,
	);

	const packages = output.split("\n").filter(Boolean);

	for (const package of packages) {
		const jsonVersions = await runAndGetOutput(
			`pnpm view ${package} versions --json`,
		);
		const versions = JSON.parse(jsonVersions).filter((x) =>
			x.includes("canary"),
		);

		for (const version of versions) {
			console.log(`Unpublishing ${package}@${version}`);
			await run(`pnpm unpublish ${package}@${version}`).catch(() => {
				console.error(`Failed to unpublish ${package}@${version}`);
			});
		}
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
