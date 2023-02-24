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
import { escapeHtml } from "../runtime/utils";

export interface RenderOptions {
	root?: string;
	crawl?: boolean;
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
		pico.black(pico.bgMagenta(" RAKKAS ")) +
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

	await doPrerender(config, paths.length ? paths : undefined, options.crawl);
}

export async function doPrerender(
	config: ResolvedConfig,
	defaultPaths?: string[],
	autoCrawl?: boolean,
) {
	autoCrawl = autoCrawl ?? !defaultPaths?.length;
	const outDir = path.resolve(config!.root, config!.build.outDir);
	let pathNames: string[] =
		defaultPaths ?? ((config as any).api?.rakkas?.prerender || []);
	const origin = "http://localhost";

	if (pathNames.length === 0) {
		pathNames = ["/"];
	}

	installNodeFetch();

	process.env.RAKKAS_PRERENDER = "true";
	const fileUrl = pathToFileURL(outDir + "/server/hattip.js").href;
	const { default: handler } = (await import(fileUrl)) as {
		default: HattipHandler;
	};

	const paths = new Set<string>(pathNames);
	const files = new Map<string, [status: number, error: unknown]>();
	const dirs = new Set<string>();

	function crawl(href: URL | string) {
		const url = new URL(href, origin);
		if (url.origin !== origin) {
			return;
		}

		paths.add(url.pathname);
	}

	if (process.stdout.isTTY) {
		// Hide cursor
		process.stdout.write("\u001B[?25l");
	}

	for (const currentPath of paths) {
		if (process.stdout.isTTY) {
			process.stdout.clearLine(0);
			process.stdout.cursorTo(0);
		}
		process.stdout.write(pico.gray("Crawling ") + currentPath);

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
					error?: unknown,
				) {
					const url = new URL(pathname, origin);
					const {
						shouldPrerender = true,
						shouldCrawl = autoCrawl ? shouldPrerender : false,
						links = [],
					} = options || ({} as PrerenderResult);

					links.forEach((link) => crawl(new URL(link, url)));

					if (!shouldPrerender && !shouldCrawl) {
						return;
					}

					const isRedirect = response.status >= 300 && response.status < 400;
					const isPage =
						response.headers.get("content-type")?.split(";")[0] ===
							"text/html" || isRedirect;

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
							if (!body) {
								body = isRedirect
									? `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${escapeHtml(
											response.headers.get("location")!,
									  )}"></head></html>`
									: "";
							}

							await fs.promises.writeFile(filename, body);
							files.set(pathname, [response.status, error]);
						} else {
							files.set(pathname, [-1, undefined]);
						}
					}
				},
			},
		});
	}

	if (process.stdout.isTTY) {
		// Show cursor
		process.stdout.write("\u001B[?25h");
		process.stdout.clearLine(0);
		process.stdout.cursorTo(0);
	}

	const fileNames = [...files.entries()]
		.filter(([, v]) => v[0] !== -1)
		.sort((a, b) => {
			if (!!a[1][1] === !!b[1][1]) {
				return a[0].localeCompare(b[0]);
			} else {
				return a[1][1] ? 1 : -1;
			}
		})
		.map(([name]) => name);

	if (fileNames.length > 0) {
		let errorCount = 0;
		for (const [, [, error]] of files) {
			if (error) {
				errorCount++;
			}
		}

		config.logger.info(
			(errorCount ? pico.yellow("!") : pico.green("✓")) +
				` ${plural(fileNames.length, "static route")} prerendered` +
				(errorCount ? ` (${plural(errorCount, "error")})` : "."),
		);

		let errorSeen = false;
		for (const fileName of fileNames) {
			const [status, error] = files.get(fileName)!;

			if (error) {
				if (!errorSeen) {
					config.logger.info(
						pico.red("\nSome pages were rendered with errors:"),
					);
					errorSeen = true;
				}
			}

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

			if (error) {
				config.logger.error((error as any)?.stack);
			}
		}
	}
}

function plural(n: number, s: string) {
	return n + " " + (n === 1 ? s : s + "s");
}
