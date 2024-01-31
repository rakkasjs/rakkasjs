import { performance } from "node:perf_hooks";
import { BuildOptions, ServerOptions, LogLevel } from "vite";
import { cac } from "cac";
import { version } from "../../package.json";
import { spawn } from "node:child_process";

export const startTime = performance.now();

export interface GlobalCLIOptions {
	"--"?: string[];
	c?: boolean | string;
	config?: string;
	base?: string;
	l?: LogLevel;
	logLevel?: LogLevel;
	clearScreen?: boolean;
	d?: boolean | string;
	debug?: boolean | string;
	f?: string;
	filter?: string;
	m?: string;
	mode?: string;
}

const cli = cac("rakkas");

/**
 * removing global flags before passing as command specific sub-configs
 */
export function cleanOptions<Options extends GlobalCLIOptions>(
	options: Options,
): Omit<Options, keyof GlobalCLIOptions> {
	const ret = { ...options };
	delete ret["--"];
	delete ret.c;
	delete ret.config;
	delete ret.base;
	delete ret.l;
	delete ret.logLevel;
	delete ret.clearScreen;
	delete ret.d;
	delete ret.debug;
	delete ret.f;
	delete ret.filter;
	delete ret.m;
	delete ret.mode;
	return ret;
}

declare global {
	// eslint-disable-next-line no-var
	var __vavite_loader__: boolean;
}

cli
	.option("-c, --config <file>", `[string] use specified config file`)
	.option("--base <path>", `[string] public base path (default: /)`)
	.option("-l, --logLevel <level>", `[string] info | warn | error | silent`)
	.option("--clearScreen", `[boolean] allow/disable clear screen when logging`)
	.option("-d, --debug [feat]", `[string | boolean] show debug logs`)
	.option("-f, --filter <filter>", `[string] filter debug logs`)
	.option("-m, --mode <mode>", `[string] set env mode`);

cli
	.command("[root]", "Start a dev server")
	.alias("dev")
	.alias("serve")
	.option("--host [host]", `[string] specify hostname`)
	.option("--port <port>", `[number] specify port`)
	.option("--https", `[boolean] use TLS + HTTP/2`)
	.option("--open [path]", `[boolean | string] open browser on startup`)
	.option("--cors", `[boolean] enable CORS`)
	.option("--strictPort", `[boolean] exit if specified port is already in use`)
	.option(
		"--force",
		`[boolean] force the optimizer to ignore the cache and re-bundle`,
	)
	.option("--use-loader", `[boolean] use ESM loader (experimental)`)

	.action(
		async (
			root: string,
			options: ServerOptions &
				GlobalCLIOptions & {
					useLoader?: boolean;
				},
		) => {
			if (options.useLoader && !global.__vavite_loader__) {
				// Rerun the command with the loader options
				const options =
					(process.env.NODE_OPTIONS ? process.env.NODE_OPTIONS + " " : "") +
					"-r rakkasjs/suppress-loader-warnings --loader rakkasjs/node-loader";

				const cp = spawn(process.execPath, process.argv.slice(1), {
					stdio: "inherit",
					env: {
						...process.env,
						NODE_OPTIONS: options,
					},
				});

				cp.on("error", (err) => {
					console.error(err);
					process.exit(1);
				});

				cp.on("exit", (code) => {
					process.exit(code ?? 0);
				});

				return;
			}

			delete options.useLoader;

			return import("./serve").then(({ serve }) => serve(root, options));
		},
	);

cli
	.command("build [root]", "Build for production")
	.option("--target <target>", `[string] transpile target (default: 'modules')`)
	.option("--outDir <dir>", `[string] output directory (default: dist)`)
	.option(
		"--assetsDir <dir>",
		`[string] directory under outDir to place assets in (default: _assets)`,
	)
	.option(
		"--assetsInlineLimit <number>",
		`[number] static asset base64 inline threshold in bytes (default: 4096)`,
	)
	.option(
		"--ssr [entry]",
		`[string] build specified entry for server-side rendering`,
	)
	.option(
		"--sourcemap",
		`[boolean] output source maps for build (default: false)`,
	)
	.option(
		"--minify [minifier]",
		`[boolean | "terser" | "esbuild"] enable/disable minification, ` +
			`or specify minifier to use (default: esbuild)`,
	)
	.option("--manifest", `[boolean] emit build manifest json`)
	.option("--ssrManifest", `[boolean] emit ssr manifest json`)
	.option(
		"--emptyOutDir",
		`[boolean] force empty outDir when it's outside of root`,
	)
	.option("-w, --watch", `[boolean] rebuilds when modules have changed on disk`)
	.action((root: string, options: BuildOptions & GlobalCLIOptions) =>
		import("./build").then(({ build }) => build(root, options)),
	);

cli
	.command("preview [root]", "Start a preview server using production build")
	.option("--host [host]", `[string] specify hostname`)
	.option("--port <port>", `[number] specify port`)
	.option("--https", `[boolean] use TLS + HTTP/2`)
	.option("--open [path]", `[boolean | string] open browser on startup`)
	.option("--cors", `[boolean] enable CORS`)
	.option("--strictPort", `[boolean] exit if specified port is already in use`)
	.action(async (root: string, options: ServerOptions & GlobalCLIOptions) =>
		import("./preview").then(({ preview }) => preview(root, options)),
	);

cli
	.command(
		"prerender [...paths]",
		"Prerender static pages of an already built app",
	)
	.option("-r, --root <root>", "Project root")
	.option(
		"-C, --crawl",
		"[boolean] Crawl links on pages to find more pages to prerender",
	)
	.action((paths: string[], options: any) =>
		import("./prerender").then(({ prerender }) => prerender(paths, options)),
	);

cli
	.command("page-urls", "Generate a URL builder for pages")
	.option(
		"-s, --search <search-param-serializer-module[::export-name]>",
		"Module name that default exports a search param serializer. E.g. qs::stringify.",
	)
	.action((options: { search?: string }) =>
		import("./page-urls").then(
			({ generatePageUrlBuilder: generateUrlBuilder }) =>
				generateUrlBuilder(options),
		),
	);

cli.help();
cli.version(version);

cli.parse();
