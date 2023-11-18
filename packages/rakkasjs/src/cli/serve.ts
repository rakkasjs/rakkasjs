import { performance } from "node:perf_hooks";
import { createServer, InlineConfig, resolveConfig, ServerOptions } from "vite";
import { cleanOptions, GlobalCLIOptions, startTime } from ".";
import pico from "picocolors";
import { version } from "../../package.json";
import rakkas from "../vite-plugin";

export async function serve(
	root: string,
	options: ServerOptions & GlobalCLIOptions,
) {
	const serverOptions: ServerOptions = cleanOptions(options);
	const inlineConfig: InlineConfig = {
		root,
		base: options.base,
		mode: options.mode,
		configFile: options.config,
		logLevel: options.logLevel,
		clearScreen: options.clearScreen,
		server: serverOptions,
	};

	const initialConfig = await resolveConfig(inlineConfig, "serve").catch(
		(error) => {
			console.error(pico.red(`error resolving config:\n${error.stack}`), {
				error,
			});
			process.exit(1);
		},
	);

	if (!initialConfig.plugins.some((p) => p.name === "rakkasjs:inject-config")) {
		inlineConfig.plugins = [rakkas()];
	}

	try {
		const server = await createServer(inlineConfig);

		if (!server.httpServer) {
			throw new Error("HTTP server not available");
		}

		await server.listen();

		const info = server.config.logger.info;

		const startupDurationString = startTime
			? pico.dim(
					`(ready in ${pico.white(
						pico.bold(Math.ceil(performance.now() - startTime)),
					)} ms)`,
			  )
			: "";

		info(
			`\n  ${pico.green(
				pico.black(pico.bgMagenta(" RAKKAS ")) +
					" " +
					pico.magenta(version) +
					" development server is running 💃",
			)} ${startupDurationString}\n`,
			{ clear: !server.config.logger.hasWarned },
		);

		server.printUrls();
	} catch (e: any) {
		initialConfig.logger.error(
			pico.red(`error when starting dev server:\n${e.stack}`),
			{ error: e },
		);
		process.exit(1);
	}
}
