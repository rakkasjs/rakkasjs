import chalk from "chalk";
import commander from "commander";
import open from "open";
import { loadConfig } from "../lib/config";
import { installNodeFetch } from "../runtime/install-node-fetch";
import { createServers } from "../lib/servers";

const { Command } = commander;

export default function devCommand() {
	return new Command("dev")
		.option(
			"-p, --port <port>",
			"development server port number",
			process.env.PORT || "3000",
		)
		.option(
			"-H, --host <host>",
			"development server host",
			process.env.HOST || "localhost",
		)
		.option(
			"-s, --secure",
			"Use HTTPS server"
		)
		.option("-o, --open", "open in browser")
		.description("Start a development server")
		.action(startServer);
}

async function startServer(opts: { port: string; host: string; open?: true, secure?: true }) {
	installNodeFetch();

	const port = Number(opts.port);
	if (!Number.isInteger(port)) {
		throw new Error(`Invalid port number ${opts.port}`);
	}

	if (opts.secure) {
		console.log(chalk.green("Using HTTPS server"));
	}

	const host = opts.host;

	let { config, deps } = await loadConfig({
		command: "dev",
		deploymentTarget: "node",
	});

	async function reload() {
		({ config, deps } = await loadConfig({
			command: "dev",
			deploymentTarget: "node",
		}));

		http.on("close", async () => {
			const newServers = await createServers({
				config,
				deps,
				onReload: reload,
			});

			http = newServers.http;
			http.listen(3000).on("listening", () => {
				// eslint-disable-next-line no-console
				console.log(chalk.whiteBright("Server restarted"));
			});
		});

		http.close();
	}

	let { http } = await createServers({
		config,
		deps,
		onReload: reload,
		https: opts.secure
	});

	http.listen({ port, host }).on("listening", async () => {
		const url = opts.secure ? `https://${host}:${port}` : `http://${host}:${port}`
		// eslint-disable-next-line no-console
		console.log(
			chalk.green("Server listening on"),
			chalk.whiteBright(url),
		);

		if (opts.open) {
			// eslint-disable-next-line no-console
			console.log(chalk.blue("Launching the browser"));
			await open(url);
		}
	});
}
