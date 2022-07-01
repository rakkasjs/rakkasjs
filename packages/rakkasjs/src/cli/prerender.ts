import type { HattipHandler } from "@hattip/core";
import installNodeFetch from "@hattip/polyfills/node-fetch";
import { ResolvedConfig, resolveConfig } from "vite";
import pico from "picocolors";
import fs from "fs";
import path from "path";
import { GlobalCLIOptions } from ".";
import { version } from "../../package.json";
import { load } from "cheerio";
import { pathToFileURL } from "url";

export interface PrerenderOptions {
	path?: string[];
}

export async function prerender(
	root: string,
	options: PrerenderOptions & GlobalCLIOptions,
) {
	const config = await resolveConfig(
		{
			root,
			base: options.base,
			mode: options.mode,
			configFile: options.config,
			logLevel: options.logLevel,
			clearScreen: options.clearScreen,
			build: { ssr: true },
		},
		"build",
	);

	config.logger.info(
		pico.black(pico.bgMagenta(" Rakkas ")) +
			" " +
			pico.magenta(version) +
			" 💃",
	);

	config.logger.info(
		"\n" +
			pico.magenta("rakkas") +
			": Prerendering static routes (" +
			pico.green("1/1") +
			")",
	);

	await doPrerender(config, options.path ?? ["/"]);
}

export async function doPrerender(
	config: ResolvedConfig,
	defaultPaths: string[] = [],
) {
	const outDir = path.resolve(config!.root, config!.build.outDir);
	const pathNames: string[] = (config as any).api?.rakkas?.prerender || [];
	pathNames.push(...defaultPaths);

	installNodeFetch();

	process.env.RAKKAS_PRERENDER = "true";
	const fileUrl = pathToFileURL(outDir + "/server/hattip.js").href;
	const { default: handler } = (await import(fileUrl)) as {
		default: HattipHandler;
	};

	const paths = new Set<string>(pathNames);
	const files = new Map<string, number>();
	const dirs = new Set<string>();

	for (const currentPath of paths) {
		const request = new Request("http://localhost" + currentPath, {
			headers: { "User-Agent": "rakkasjs-crawler" },
		});

		await handler({
			request,
			ip: "127.0.0.1",
			passThrough() {
				// Do nothing
			},
			waitUntil() {
				// Do nothing
			},
			platform: {
				async prerender(pathname: string, response: Response) {
					const isPage =
						response.headers.get("content-type")?.split(";")[0] === "text/html";

					if (isPage) {
						if (!pathname.endsWith("/")) {
							pathname += "/";
						}

						pathname += "index.html";
					} else if (pathname.endsWith("/")) {
						pathname = pathname.slice(0, -1);
					}

					const filename = outDir + "/client" + pathname;

					if (!files.has(pathname)) {
						const dirname = path.dirname(filename);
						if (!dirs.has(dirname)) {
							await fs.promises.mkdir(dirname, { recursive: true });
							dirs.add(dirname);
						}

						if (isPage) {
							const html = await response.text();
							const dom = load(html);
							dom("a[href]").each((_, el) => {
								paths.add(el.attribs.href);
							});
							dom("area[href]").each((_, el) => {
								paths.add(el.attribs.href);
							});
							await fs.promises.writeFile(filename, html);
						} else {
							await fs.promises.writeFile(filename, response.body as any);
						}

						files.set(pathname, response.status);
					}
				},
			},
		});
	}

	const fileNames = [...files.keys()].sort();

	if (fileNames.length > 0) {
		config.logger.info(
			pico.green("✓") + ` ${fileNames.length} static routes prerendered.`,
		);

		for (const fileName of fileNames) {
			const status = files.get(fileName)!;

			config.logger.info(
				(status < 300
					? status
					: status < 400
					? pico.yellow(status)
					: pico.red(status)) +
					" " +
					pico.gray(config.build.outDir + "/client/") +
					pico.cyan(fileName.slice(1)),
			);
		}
	}
}
