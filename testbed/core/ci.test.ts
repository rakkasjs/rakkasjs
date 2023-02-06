/* eslint-disable import/no-named-as-default-member */
/// <reference types="vite/client" />

import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess } from "child_process";
import fetch from "node-fetch";
import path from "path";
import psTree from "ps-tree";
import puppeteer, { ElementHandle } from "puppeteer";
import { promisify } from "util";
import { kill } from "process";
import { load } from "cheerio";
import fs from "fs";

const TEST_HOST = import.meta.env.TEST_HOST || "http://localhost:3000";

if (import.meta.env.TEST_HOST) {
	testCase(
		"Running on existing server",
		process.env.TEST_ENV !== "production",
		TEST_HOST,
	);
} else {
	if ((process.env.INCLUDE_TESTS ?? "all") === "all") {
		process.env.INCLUDE_TESTS = "dev,prod,wrangler,netlify,netlify-edge,deno";
	}

	const include = process.env.INCLUDE_TESTS!.split(",").filter(Boolean);

	if (include.includes("dev")) {
		testCase("Development Mode", true, TEST_HOST, "pnpm dev");
	}

	if (include.includes("prod")) {
		testCase("Production Mode", false, TEST_HOST, "pnpm build && pnpm start");
	}
}

const browser = await puppeteer.launch({
	// headless: false,
	defaultViewport: { width: 1200, height: 800 },
});

const pages = await browser.pages();
const page = pages[0];

function testCase(title: string, dev: boolean, host: string, command?: string) {
	describe(title, () => {
		if (command) {
			let cp: ChildProcess | undefined;
			let killing = false;

			beforeAll(async () => {
				cp = spawn(command, {
					shell: true,
					stdio: "inherit",
					cwd: path.resolve(__dirname),
					env: {
						...process.env,
						BROWSER: "none",
					},
				});

				await new Promise<void>((resolve, reject) => {
					cp!.on("error", (error) => {
						cp = undefined;
						reject(error);
					});

					cp!.on("exit", (code) => {
						if (!killing && code !== 0) {
							cp = undefined;
							reject(new Error(`Process exited with code ${code}`));
						}
					});

					const interval = setInterval(() => {
						fetch(host + "/")
							.then(async (r) => {
								const text = await r.text();
								if (
									r.status === 200 &&
									text.includes("This is a shared header.") &&
									text.includes("Hello world!")
								) {
									clearInterval(interval);
									resolve();
								}
							})
							.catch(() => {
								// Ignore error
							});
					}, 250);
				});
			}, 60_000);

			afterAll(async () => {
				if (!cp || cp.exitCode || !cp.pid) {
					return;
				}

				killing = true;

				const tree = await promisify(psTree)(cp.pid);
				const pids = [cp.pid, ...tree.map((p) => +p.PID)];

				for (const pid of pids) {
					kill(+pid, "SIGINT");
				}

				await new Promise((resolve) => {
					cp!.on("exit", resolve);
				});
			});
		}

		test("renders simple API route", async () => {
			const response = await fetch(host + "/api-routes/simple");
			expect(response.ok).toBe(true);
			const text = await response.text();
			expect(text).toEqual("Hello from API route");
		});

		test("runs middleware", async () => {
			const response = await fetch(host + "/api-routes/simple?abort=1");
			expect(response.ok).toBe(true);
			const text = await response.text();
			expect(text).toEqual("Hello from middleware");

			const response2 = await fetch(host + "/api-routes/simple?modify=1");
			expect(response2.status).toBe(200);
			const text2 = await response2.text();
			expect(text2).toEqual("Hello from API route");
			expect(response2.headers.get("x-middleware")).toEqual("1");
		});

		test("renders params in API route", async () => {
			const response = await fetch(host + "/api-routes/param-value");
			expect(response.ok).toBe(true);
			const json = await response.json();
			expect(json).toMatchObject({ param: "param-value" });
		});

		test("unescapes params in API route", async () => {
			const response = await fetch(host + "/api-routes/param%20value");
			expect(response.ok).toBe(true);
			const json = await response.json();
			expect(json).toMatchObject({ param: "param value" });
		});

		test("renders spread params in API route", async () => {
			const response = await fetch(host + "/api-routes/more/aaa/bbb/ccc");
			expect(response.ok).toBe(true);
			const json = await response.json();
			expect(json).toMatchObject({ rest: "/aaa/bbb/ccc" });
		});

		test("doesn't unescape spread params in API route", async () => {
			const response = await fetch(host + "/api-routes/more/aaa%2Fbbb/ccc");
			expect(response.ok).toBe(true);
			const json = await response.json();
			expect(json).toMatchObject({ rest: "/aaa%2Fbbb/ccc" });
		});

		test("handles credentials in ctx.fetch", async () => {
			const json = await fetch(host + "/fetch", {
				headers: { Authorization: "1234" },
			}).then((r) => r.json());

			expect(json).toMatchObject({
				withCredentials: "1234",
				withoutCredentials: "",
				withImplicitCredentials: "1234",
			});
		});

		test("renders interactive page", async () => {
			await page.goto(host + "/");

			// Wait a little to allow for dependency optimization
			await new Promise((resolve) => setTimeout(resolve, 1_000));

			await page.waitForSelector(".hydrated");

			const button: ElementHandle<HTMLButtonElement> | null =
				await page.waitForSelector("button");
			expect(button).toBeTruthy();

			await button!.click();

			await page.waitForFunction(
				() => document.querySelector("button")?.textContent === "Clicked: 1",
			);
		});

		test("renders preloaded data", async () => {
			const response = await fetch(host + "/");
			expect(response.ok).toBe(true);

			const html = await response.text();
			const dom = load(html);

			expect(dom("p#metadata").text()).toBe("Metadata: 2");
			expect(dom("title").text()).toBe("The page title");
		});

		test("decodes page params", async () => {
			const response = await fetch(host + "/page-params/unescape%20me");
			expect(response.ok).toBe(true);

			const html = await response.text();
			const dom = load(html);

			expect(dom("p#param").text()).toBe("unescape me");
		});

		test("doesn't unescape spread page params", async () => {
			const response = await fetch(host + "/page-params/spread/escape%2Fme");
			expect(response.ok).toBe(true);

			const html = await response.text();
			const dom = load(html);

			expect(dom("p#param").text()).toBe("/escape%2Fme");
		});

		if (dev) {
			test(
				"hot reloads page",
				async () => {
					await page.goto(host + "/");

					// Wait a little (for some reason Windows requires this)
					await new Promise((resolve) => setTimeout(resolve, 1_000));

					await page.waitForSelector(".hydrated");

					const button: ElementHandle<HTMLButtonElement> | null =
						await page.waitForSelector("button");

					await button!.click();

					await page.waitForFunction(
						() =>
							document.querySelector("button")?.textContent === "Clicked: 1",
					);

					const filePath = path.resolve(__dirname, "src/routes/index.page.tsx");

					const oldContent = await fs.promises.readFile(filePath, "utf8");
					const newContent = oldContent.replace(
						"Hello world!",
						"Hot reloadin'!",
					);

					await fs.promises.writeFile(filePath, newContent);

					try {
						await page.waitForFunction(() =>
							document.body?.textContent?.includes("Hot reloadin'!"),
						);
						await page.waitForFunction(
							() =>
								document.querySelector("button")?.textContent === "Clicked: 1",
						);
					} finally {
						await fs.promises.writeFile(filePath, oldContent);
					}
				},
				{ retry: 3, timeout: 15_000 },
			);

			test(
				"newly created page appears",
				async () => {
					await page.goto(host + "/not-yet-created");

					// Wait a little (for some reason Windows requires this)
					await new Promise((resolve) => setTimeout(resolve, 1_000));

					await page.waitForSelector(".hydrated");

					const filePath = path.resolve(
						__dirname,
						"src/routes/not-yet-created.page.tsx",
					);
					const content = `export default () => <h1>I'm a new page!</h1>`;
					await fs.promises.writeFile(filePath, content);

					try {
						await page.waitForFunction(() =>
							document.body?.textContent?.includes("I'm a new page!"),
						);

						await fs.promises.rm(filePath);

						await page.waitForFunction(
							() => !document.body?.textContent?.includes("Not found"),
						);
					} finally {
						await fs.promises.rm(filePath).catch(() => {
							// Ignore
						});
					}
				},
				{ retry: 3, timeout: 15_000 },
			);
		}

		test(
			"sets page title",
			async () => {
				await page.goto(host + "/title");

				await page.waitForFunction(() => document.title === "Page title");
			},
			// This is flaky on Mac, probably because it can't recover from the
			// previous test's hot reload.
			{ retry: 3 },
		);
	});
}

afterAll(async () => {
	await browser.close();
});
