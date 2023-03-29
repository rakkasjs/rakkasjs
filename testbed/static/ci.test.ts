/* eslint-disable import/no-named-as-default-member */
/// <reference types="vite/client" />

import { spawn, ChildProcess } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { kill } from "node:process";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import psTree from "ps-tree";
import puppeteer, { ElementHandle } from "puppeteer";

const TEST_HOST = import.meta.env.TEST_HOST || "http://localhost:3000";

const browser = await puppeteer.launch({
	// headless: false,
	defaultViewport: { width: 1200, height: 800 },
});

const pages = await browser.pages();
const page = pages[0];

describe(TEST_HOST, () => {
	if (!import.meta.env.TEST_HOST) {
		let cp: ChildProcess | undefined;

		beforeAll(async () => {
			cp = spawn("pnpm build && pnpm start", {
				shell: true,
				stdio: "inherit",
				cwd: path.resolve(__dirname),
			});

			await new Promise<void>((resolve, reject) => {
				cp!.on("error", (error) => {
					cp = undefined;
					reject(error);
				});

				cp!.on("exit", (code) => {
					if (code !== 0) {
						cp = undefined;
						reject(new Error(`Process exited with code ${code}`));
					}
				});

				const interval = setInterval(() => {
					fetch(TEST_HOST + "/")
						.then(async (r) => {
							const text = await r.text();
							if (r.status === 200 && text.includes("Hello world!")) {
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

	test("renders API route", async () => {
		const response = await fetch(TEST_HOST + "/json/endpoint.json");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ hello: "world" });
	});

	test("renders page with API route", async () => {
		const response = await fetch(TEST_HOST + "/json");
		expect(response.status).toBe(200);
		expect(await response.text()).to.contain(
			`&quot;hello&quot;: &quot;world&quot;`,
		);
	});

	test("hydrates page with API route", async () => {
		await page.goto(TEST_HOST + "/json");
		await page.waitForSelector(".hydrated");

		await page.waitForFunction(() =>
			document.querySelector("body")?.textContent?.includes(`"hello": "world"`),
		);
	});

	test("renders API route in page (client-side nav)", async () => {
		await page.goto(TEST_HOST + "/");
		await page.waitForSelector(".hydrated");

		const link = (await page.waitForSelector(
			"a[href='/json']",
		)) as ElementHandle<HTMLAnchorElement>;

		expect(link).toBeTruthy();
		await link.click();

		await page.waitForFunction(() =>
			document.querySelector("body")?.textContent?.includes(`"hello": "world"`),
		);
	});

	test("renders redirection page", async () => {
		await page.goto(TEST_HOST + "/redirect");
		await page.waitForFunction(() =>
			document
				.querySelector("body")
				?.textContent?.includes("Redirection worked!"),
		);
	});

	test("renders page with server-side query", async () => {
		const response = await fetch(TEST_HOST + "/ssq");
		expect(response.status).toBe(200);
		expect(await response.text()).to.contain("an interesting value");
	});

	test("hydrates page with server-side query", async () => {
		await page.goto(TEST_HOST + "/ssq");
		await page.waitForSelector(".hydrated");

		await page.waitForFunction(() =>
			document
				.querySelector("body")
				?.textContent?.includes("an interesting value"),
		);
	});
});

afterAll(async () => {
	await browser.close();
});
