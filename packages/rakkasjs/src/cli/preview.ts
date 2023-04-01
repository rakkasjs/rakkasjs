import fs from "node:fs";
import path from "node:path";
import sirv from "sirv";
import { createMiddleware } from "@hattip/adapter-node";
import pico from "picocolors";
import {
	InlineConfig,
	preview as previewServer,
	resolveConfig,
	ServerOptions,
} from "vite";
import { cleanOptions, GlobalCLIOptions, startTime } from ".";
import { version } from "../../package.json";

export async function preview(
	root = process.cwd(),
	options: ServerOptions & GlobalCLIOptions,
) {
	const serverOptions: ServerOptions = cleanOptions(options);
	const inlineConfig: InlineConfig = {
		root,
		base: options.base,
		mode: options.mode,
		preview: serverOptions,
		configFile: options.config,
		logLevel: options.logLevel,
		clearScreen: options.clearScreen,
		optimizeDeps: { force: options.force },
	};

	const initialConfig = await resolveConfig(inlineConfig, "serve").catch(
		(error) => {
			console.error(pico.red(`error resolving config:\n${error.stack}`), {
				error,
			});
			process.exit(1);
		},
	);
	const DIST_DIR = path.join(root, initialConfig.build.outDir);
	const HANDLER_PATH = path.join(DIST_DIR, "server", "hattip.js");
	const ASSETS_DIR = path.join(DIST_DIR, "client");

	if (!fs.existsSync(HANDLER_PATH)) {
		// eslint-disable no-console
		console.error(
			`\n  ${
				pico.black(pico.bgMagenta(" RAKKAS ")) +
				" " +
				pico.magenta(version) +
				" " +
				pico.red("Please run `rakkas build` before running preview server.")
			}`,
		);
		return;
	}

	try {
		const handlerImport = await import(HANDLER_PATH);
		const sirvHandler = sirv(ASSETS_DIR);
		const handler = createMiddleware(handlerImport.default);

		const originalNodeEnv = process.env.NODE_ENV;

		const server = await previewServer({
			...inlineConfig,
			publicDir: path.join(DIST_DIR),
		});

		// Restore NODE_ENV after vite has set it to "development"
		process.env.NODE_ENV = originalNodeEnv;

		// remove default handler and pass all handler to hatTip and sirv ( for assets )
		server.httpServer.listeners("request").forEach(function (l: any) {
			server.httpServer.removeListener("request", l);
			server.httpServer.on("request", function (req, res) {
				sirvHandler(req, res, () => {
					handler(req, res, () => {
						if (!res.writableEnded) {
							res.writeHead(404);
							res.end();
						}
					});
				});
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

		server.printUrls();
	} catch (e: any) {
		initialConfig.logger.error(
			pico.red(`error when starting dev server:\n${e.stack}`),
			{ error: e },
		);
		process.exit(1);
	}
}
