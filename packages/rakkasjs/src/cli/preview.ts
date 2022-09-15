import { createMiddleware } from "@hattip/adapter-node";
import fs from "fs";
import path from "path";
import pico from "picocolors";
import { InlineConfig, preview as previewServer, resolveConfig, ServerOptions } from "vite";
import { cleanOptions, GlobalCLIOptions, startTime } from ".";
import { version } from "../../package.json";

export async function preview(
	root: string,
	options: ServerOptions & GlobalCLIOptions,
) {
	const serverOptions: ServerOptions = cleanOptions(options);	
	const inlineConfig: InlineConfig = {
		root,
		base: options.base,
		mode: options.mode,
		server: serverOptions,
		configFile: options.config,
		logLevel: options.logLevel,
		clearScreen: options.clearScreen,
		optimizeDeps: { force: options.force }
	};

	const initialConfig = await resolveConfig(inlineConfig, "serve").catch(
		(error) => {
			console.error(pico.red(`error resolving config:\n${error.stack}`), {
				error,
			});
			process.exit(1);
		},
	);
	const DIST_DIR = path.join(process.cwd(), initialConfig.build.outDir);
	const HANDLER_PATH = path.join(DIST_DIR, "server", "hattip.js")

	if (!fs.existsSync(HANDLER_PATH)) {
		// eslint-disable no-console
		console.error(`\n  ${pico.black(pico.bgMagenta(" RAKKAS ")) + " " + pico.magenta(version) + " " + pico.red("Please run `rakkas build` before running preview server.")}`);	
		return;
	}

	try {
		const handler = await import(HANDLER_PATH);
		const listener = createMiddleware(handler.default);

		const server = await previewServer({
			...inlineConfig,
			publicDir: path.join(DIST_DIR, "client"),
		});

		// remove default handler and pass all handler to hatTip
		server.httpServer.listeners("request").forEach(function (l: any) {
			server.httpServer.removeListener("request", l);
			server.httpServer.on("request", function (req, res) {
				listener(req, res)
			});
		});

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
				" production preview server is running 💃",
			)} ${startupDurationString}\n`,
			{ clear: !server.config.logger.hasWarned },
		);

		server.printUrls()

	} catch (err) {
	}
}
