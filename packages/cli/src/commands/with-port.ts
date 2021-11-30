import { spawn } from "child_process";
import commander from "commander";
import getPort from "get-port";

const { Command } = commander;

export default function withPortCommand() {
	return new Command("with-port")
		.description(
			"Find a free port and setup environment variables HOST, PORT, and CYPRESS_BASE_URL before running a command",
		)
		.argument("<command...>", "Command to run")
		.action(async (args) => {
			const command = args.join(" ");

			const host = "localhost";
			const port = String(await getPort());

			const p = spawn(command, {
				shell: true,
				env: {
					...process.env,
					HOST: host,
					PORT: port,
					CYPRESS_BASE_URL: `http://${host}:${port}`,
				},
				stdio: "inherit",
			});

			p.on("exit", (code) => process.exit(code || 0));
		});
}
