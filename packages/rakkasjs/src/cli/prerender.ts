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
import { PrerenderResult } from "../runtime/page-types";

export interface RenderOptions {
	root?: string;
}

export async function prerender(
	paths: string[],
	options: RenderOptions & GlobalCLIOptions,
) {
	const config = await resolveConfig(
		{
			root: options.root,
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
			": Rendering static routes (" +
			pico.green("1/1") +
			")",
	);

	await doPrerender(config, paths ?? ["/"]);
}

export async function doPrerender(
	config: ResolvedConfig,
	defaultPaths: string[] = [],
) {
	const outDir = path.resolve(config!.root, config!.build.outDir);
	const pathNames: string[] = (config as any).api?.rakkas?.prerender || [];
	pathNames.push(...defaultPaths);
	const origin = "http://localhost";

	installNodeFetch();

	process.env.RAKKAS_PRERENDER = "true";
	const fileUrl = pathToFileURL(outDir + "/server/hattip.js").href;
	const { default: handler } = (await import(fileUrl)) as {
		default: HattipHandler;
	};

	const paths = new Set<string>(pathNames);
	const files = new Map<string, number>();
	const dirs = new Set<string>();

	function crawl(href: URL | string) {
		const url = new URL(href, origin);
		if (url.origin !== origin) {
			return;
		}

		paths.add(url.pathname);
	}

	for (const currentPath of paths) {
		const request = new Request(origin + currentPath, {
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
				async render(
					pathname: string,
					response: Response,
					options: PrerenderResult,
				) {
					const url = new URL(pathname, origin);
					const {
						shouldPrerender = true,
						shouldCrawl = shouldPrerender,
						links = [],
					} = options || ({} as PrerenderResult);

					links.forEach((link) => crawl(new URL(link, url)));

					if (!shouldPrerender && !shouldCrawl) {
						return;
					}

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

						let body: string;

						if (isPage && shouldCrawl) {
							const html = await response.text();
							const dom = load(html);
							dom("a[href]").each((_, el) => {
								crawl(new URL(el.attribs.href, url));
							});
							dom("area[href]").each((_, el) => {
								crawl(new URL(el.attribs.href, url));
							});
							body = html;
						} else {
							body = response.body as any;
						}

						if (shouldPrerender) {
							await fs.promises.writeFile(filename, body);
							files.set(pathname, response.status);
						} else {
							files.set(pathname, -1);
						}
					}
				},
			},
		});
	}

	const fileNames = [...files.entries()]
		.filter(([, v]) => v !== -1)
		.map((f) => f[0])
		.sort();

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
