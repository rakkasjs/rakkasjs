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
	});
}

afterAll(async () => {
	await browser.close();
});
