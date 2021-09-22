import { Command } from "commander";
import getPort from "get-port";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";
import mkdirp from "mkdirp";
import { build } from "./build";
import { spawn } from "child_process";
import fetch, { FetchError, Response } from "node-fetch";
import rimraf from "rimraf";
import os from "os";
import chalk from "chalk";

export default function exportCommand() {
	return new Command("export")
		.description("Export a static site")
		.action(async () => {
			// eslint-disable-next-line no-console
			console.log(chalk.whiteBright("Building static application"));

			const buildDir = path.join(
				await fs.promises.mkdtemp(
					path.join(os.tmpdir(), "rakkas-export-static-"),
				),
				"dist",
			);

			await build({
				buildMode: "static",
				outDir: buildDir,
			});

			const host = "localhost";
			const port = await getPort();

			// eslint-disable-next-line no-console
			console.log(chalk.whiteBright("Launching server"));

			const server = spawn("rakkas-node --quiet", {
				shell: true,
				env: { ...process.env, HOST: host, PORT: String(port) },
				stdio: "ignore",
				cwd: path.resolve(buildDir, ".."),
			});

			let firstResponse: Response | undefined;

			// eslint-disable-next-line no-console
			console.log(chalk.gray("Waiting for server to respond"));
			for (;;) {
				try {
					firstResponse = await fetch(`http://${host}:${port}`, {
						headers: { "x-rakkas-export": "static" },
					});
				} catch (err) {
					if (err instanceof FetchError) {
						await new Promise((resolve) => setTimeout(resolve, 100));
						continue;
					}
					throw err;
				}

				break;
			}

			// eslint-disable-next-line no-console
			console.log(chalk.whiteBright("Crawling the application"));
			const roots = new Set(["/"]);
			for (const root of roots) {
				const response =
					firstResponse ||
					(await fetch(`http://${host}:${port}${root}`, {
						headers: { "x-rakkas-export": "static" },
					}));

				firstResponse = undefined;

				if (!response.ok) {
					throw new Error(
						`Request to ${root} returned status ${response.status}`,
					);
				}

				if (response.headers.get("x-rakkas-export") !== "static") continue;

				// eslint-disable-next-line no-console
				console.log(chalk.gray("Exported page"), chalk.blue(root));

				const fetched = await response.text();

				const dom = cheerio.load(fetched);

				dom("a[href]").each((i, el) => {
					const url = new URL(el.attribs.href, `http://${host}:${port}`);
					if (url.origin === `http://${host}:${port}`) {
						if (!roots.has(url.pathname)) {
							roots.add(url.pathname);
						}
					}
				});
			}

			await mkdirp("dist");

			await new Promise<void>((resolve, reject) =>
				rimraf("dist/static", (error) => {
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				}),
			);

			await fs.promises.rename(path.join(buildDir, "client"), "dist/static");

			await new Promise<void>((resolve, reject) =>
				rimraf(buildDir, (error) => {
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				}),
			);

			server.kill();

			// eslint-disable-next-line no-console
			console.log(
				chalk.whiteBright("Static application exported into the directory"),
				chalk.green("dist/static"),
			);
		});
}
