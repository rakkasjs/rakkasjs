import { spawn } from "child_process";
import pico from "picocolors";

export async function run(command: string, cwd?: string) {
	return new Promise<void>((resolve, reject) => {
		// eslint-disable-next-line no-console
		console.log(pico.gray("$ " + command));

		const child = spawn(command, { stdio: "inherit", shell: true, cwd });

		child.on("error", (error) => {
			reject(error);
		});

		child.on("exit", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error("Command exited with code " + code));
			}
		});
	});
}
