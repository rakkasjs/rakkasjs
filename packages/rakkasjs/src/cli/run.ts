import { type LogLevel, createServer } from "vite";

export async function run(
	script: string,
	options: {
		base?: string;
		config?: string;
		logLevel?: LogLevel;
		clearScreen?: boolean;
		debug?: boolean | string;
		filter?: string;
		mode?: string;
	},
) {
	const server = await createServer({
		base: options.base,
		mode: options.mode,
		configFile: options.config,
		logLevel: options.logLevel,
		clearScreen: options.clearScreen,
		server: { middlewareMode: true },
	});

	await server.ssrLoadModule(script);
	process.exit(0);
}
