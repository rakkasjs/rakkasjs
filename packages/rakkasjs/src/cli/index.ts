import { BuildOptions, LogLevel } from "vite";
import { cac } from "cac";
import { version } from "../../package.json";

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

cli
	.option("-c, --config <file>", `[string] use specified config file`)
	.option("--base <path>", `[string] public base path (default: /)`)
	.option("-l, --logLevel <level>", `[string] info | warn | error | silent`)
	.option("--clearScreen", `[boolean] allow/disable clear screen when logging`)
	.option("-d, --debug [feat]", `[string | boolean] show debug logs`)
	.option("-f, --filter <filter>", `[string] filter debug logs`)
	.option("-m, --mode <mode>", `[string] set env mode`);

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
	.command("render [...paths]", "Render static pages of an already built app")
	.option("-r, --root <root>", "Project root")
	.action((paths: string[], options: any) =>
		import("./render").then(({ render: prerender }) =>
			prerender(options.root, options),
		),
	);

cli.help();
cli.version(version);

cli.parse();
