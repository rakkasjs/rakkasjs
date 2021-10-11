import { Command } from "commander";
import getPort from "get-port";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { build } from "./build";
import { spawn } from "child_process";
import fetch, { FetchError, Response } from "node-fetch";
import rimraf from "rimraf";
import chalk from "chalk";

export default function exportCommand() {
	return new Command("export")
		.description("Export a static site")
		.action(async () => {
			// eslint-disable-next-line no-console
			console.log(chalk.whiteBright("Building static application"));

			const buildDir = path.resolve("node_modules/.rakkas/export");
			const distDir = path.join(buildDir, "dist");

			await fs.promises.mkdir(distDir, { recursive: true });

			await build({
				buildMode: "static",
				outDir: distDir,
			});

			const host = "localhost";
			const port = await getPort();

			// eslint-disable-next-line no-console
			console.log(chalk.whiteBright("Launching server"));

			const server = spawn("rakkas-node --quiet", {
				shell: true,
				env: { ...process.env, HOST: host, PORT: String(port) },
				stdio: "ignore",
				cwd: buildDir,
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
			const origin = `http://${host}:${port}`;
			for (const root of roots) {
				const currentUrl = origin + root;

				const response =
					firstResponse ||
					(await fetch(currentUrl, {
						headers: { "x-rakkas-export": "static" },
					}));

				firstResponse = undefined;

				if (response.headers.get("x-rakkas-export") !== "static") continue;

				if (!response.ok) {
					// eslint-disable-next-line no-console
					console.log(
						chalk.yellowBright(
							`Request to ${root} returned status ${response.status}.`,
						),
					);
				}

				// eslint-disable-next-line no-inner-declarations
				function addPath(path: string) {
					const url = new URL(path, currentUrl);
					if (url.origin === origin) {
						roots.add(url.pathname);
					}
				}

				const location = response.headers.get("location");
				if (location) addPath(location);

				// eslint-disable-next-line no-console
				console.log(chalk.gray("Exported page"), chalk.blue(root));

				const fetched = await response.text();

				const dom = cheerio.load(fetched);

				dom("a[href]").each((i, el) => addPath(el.attribs.href));
			}

			await fs.promises.mkdir("dist", { recursive: true });

			await new Promise<void>((resolve, reject) =>
				rimraf("dist/static", (error) => {
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				}),
			);

			await fs.promises.rename(path.join(distDir, "client"), "dist/static");

			await new Promise((resolve) => {
				server.on("exit", resolve);
				server.kill();
			});

			await new Promise<void>((resolve, reject) =>
				rimraf(buildDir, (error) => {
					if (error) {
						reject(error);
					} else {
						resolve();
					}
				}),
			);

			// eslint-disable-next-line no-console
			console.log(
				chalk.whiteBright("Static application exported into the directory"),
				chalk.green("dist/static"),
			);
		});
}
