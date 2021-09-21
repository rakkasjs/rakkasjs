import { Command } from "commander";
import getPort from "get-port";
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";
import mkdirp from "mkdirp";
import { build } from "./build";
import { spawn } from "child_process";
import fetch, { FetchError } from "node-fetch";
import rimraf from "rimraf";
import os from "os";

export default function exportCommand() {
	return new Command("export")
		.description("Export a static site")
		.action(async () => {
			const buildDir = path.join(
				await fs.promises.mkdtemp(
					path.join(os.tmpdir(), "rakkas-export-static-"),
				),
				"dist",
			);

			path.resolve("static-build");

			await build({
				buildMode: "static",
				outDir: buildDir,
			});

			const host = "localhost";
			const port = await getPort();

			const server = spawn("rakkas-node " + buildDir, {
				shell: true,
				env: { ...process.env, HOST: host, PORT: String(port) },
				stdio: "inherit",
				cwd: path.resolve(buildDir, ".."),
			});

			// Wait until server starts
			for (;;) {
				try {
					await fetch(`http://${host}:${port}`);
				} catch (err) {
					if (err instanceof FetchError) {
						await new Promise((resolve) => setTimeout(resolve, 100));
						continue;
					}
					throw err;
				}

				break;
			}

			const roots = new Set(["/"]);
			for (const root of roots) {
				const htmlDir = path.join(buildDir, "client", root);
				const htmlFile = path.join(htmlDir, "index.html");

				// eslint-disable-next-line no-console
				console.log(`Exporting ${root}`);

				const fetched = await fetch(`http://${host}:${port}${root}`).then(
					(r) => {
						if (!r.ok) {
							throw new Error(`Request to ${root} returned status ${r.status}`);
						}

						return r.text();
					},
				);

				const dom = new JSDOM(fetched, {
					url: `http://${host}:${port}${root}`,
				});
				await mkdirp(htmlDir);
				await fs.promises.writeFile(htmlFile, fetched);

				dom.window.document.querySelectorAll("a[href]").forEach((el) => {
					const a = el as HTMLAnchorElement;
					if (a.origin === `http://${host}:${port}`) {
						if (!roots.has(a.pathname)) {
							roots.add(a.pathname);
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

			server.kill("SIGTERM");
		});
}
