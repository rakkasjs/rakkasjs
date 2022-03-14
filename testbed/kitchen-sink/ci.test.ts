/* eslint-disable import/no-named-as-default-member */
/// <reference types="vite/client" />

import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "child_process";
import fetch from "node-fetch";
import path from "path";
// @ts-expect-error: kill-port doesn't ship with types
import kill from "kill-port";
import puppeteer, { ElementHandle } from "puppeteer";
import fs from "fs";

const TEST_HOST = import.meta.env.TEST_HOST || "http://localhost:3000";

if (import.meta.env.TEST_HOST) {
	testCase("running server", process.env.NODE_ENV !== "production");
} else {
	testCase("development mode", true, "pnpm dev");
	testCase("production mode", false, "pnpm build && pnpm start");
}

const browser = await puppeteer.launch({
	// headless: false,
	defaultViewport: { width: 1200, height: 800 },
});

const pages = await browser.pages();
const page = pages[0];

function testCase(title: string, dev: boolean, command?: string) {
	describe(title, () => {
		if (command) {
			beforeAll(async () => {
				await kill(3000, "tcp");

				spawn(command, {
					shell: true,
					stdio: "inherit",
					cwd: path.resolve(__dirname),
				});

				await new Promise<void>((resolve) => {
					const interval = setInterval(() => {
						fetch(TEST_HOST + "/")
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
		}

		test("renders simple API route", async () => {
			const response = await fetch(TEST_HOST + "/api-routes/simple");
			expect(response.status).toBe(200);
			const text = await response.text();
			expect(text).toEqual("Hello from API route");
		});

		test("runs middleware", async () => {
			const response = await fetch(TEST_HOST + "/api-routes/simple?abort=1");
			expect(response.status).toBe(200);
			const text = await response.text();
			expect(text).toEqual("Hello from middleware");
		});

		test("renders params", async () => {
			const response = await fetch(TEST_HOST + "/api-routes/param-value");
			expect(response.status).toBe(200);
			const json = await response.json();
			expect(json).toMatchObject({ param: "param-value" });
		});

		test("renders spread params", async () => {
			const response = await fetch(TEST_HOST + "/api-routes/more/aaa/bbb/ccc");
			expect(response.status).toBe(200);
			const json = await response.json();
			expect(json).toMatchObject({ rest: "aaa/bbb/ccc" });
		});

		test("renders interactive page", async () => {
			await page.goto(TEST_HOST + "/");
			await page.waitForSelector(".hydrated");

			const button: ElementHandle<HTMLButtonElement> | null =
				await page.waitForSelector("button");
			expect(button).toBeTruthy();

			await button!.click();

			await page.waitForFunction(
				() => document.querySelector("button")?.textContent === "Clicked: 1",
			);
		});

		if (
			dev &&
			// TODO: This test fails on Windows CI. Investigate why and whether it fails on a real machine.
			process.platform !== "win32"
		) {
			test("hot reloads page", async () => {
				await page.goto(TEST_HOST + "/");
				await page.waitForSelector(".hydrated");

				const button: ElementHandle<HTMLButtonElement> | null =
					await page.waitForSelector("button");

				await button!.click();

				await page.waitForFunction(
					() => document.querySelector("button")?.textContent === "Clicked: 1",
				);

				const filePath = path.resolve(__dirname, "src/routes/index.page.tsx");
				const oldContent = await fs.promises.readFile(filePath, "utf8");
				const newContent = oldContent.replace("Hello world!", "Hot reloadin'!");

				await fs.promises.writeFile(filePath, newContent);

				try {
					await page.waitForFunction(
						() => document.body.textContent?.includes("Hot reloadin'!"),
						{ timeout: 60_000 },
					);
					await page.waitForFunction(
						() =>
							document.querySelector("button")?.textContent === "Clicked: 1",
					);
				} finally {
					await fs.promises.writeFile(filePath, oldContent);
				}
			}, 60_000);
		}

		test("sets page title", async () => {
			await page.goto(TEST_HOST + "/title");

			await page.waitForFunction(() => document.title === "Page title");
		});

		test("loads data with suspense", async () => {
			await page.goto(TEST_HOST + "/suspense");

			await page.waitForFunction(() =>
				document.body.innerText.includes("Hello world!"),
			);
		});
	});
}

afterAll(async () => {
	await browser.close();

	if (!import.meta.env.TEST_HOST) {
		await kill(3000, "tcp");
	}
});
