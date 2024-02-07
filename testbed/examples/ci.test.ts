/* eslint-disable import/no-named-as-default-member */

import { spawn, ChildProcess } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { kill } from "node:process";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import psTree from "ps-tree";
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
	headless: true,
	defaultViewport: { width: 1200, height: 800 },
});

const pages = await browser.pages();
const page = pages[0];

describe.each([{ env: "dev" }, { env: "prod" }] as const)("$env", ({ env }) => {
	let host: string;
	let command: string;
	if (env === "dev") {
		host = "http://localhost:5173";
		command = "pnpm dev";
	} else {
		host = "http://localhost:3000";
		command = "pnpm build && pnpm start";
	}

	function initialize(example: string, env?: Record<string, string>) {
		let cp: ChildProcess | undefined;

		beforeAll(async () => {
			cp = spawn(command, {
				shell: true,
				stdio: "inherit",
				cwd: path.resolve(__dirname, "../../examples", example),
				env: {
					...process.env,
					...env,
				},
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
					fetch(host + "/")
						.then(async (r) => {
							if (r.status === 200) {
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

	describe(
		"emotion",
		() => {
			initialize("emotion");

			test("page route", async () => {
				await page.goto(host + "/");
				const h1 = (await page.waitForSelector("h1"))!;
				expect(await h1.evaluate((e) => getComputedStyle(e).color)).toBe(
					"rgb(255, 0, 0)",
				);
			});
		},
		{ retry: 3 },
	);

	describe("express", () => {
		initialize("express");

		test("API route", async () => {
			const json = await fetch(host + "/express").then((r) => {
				if (!r.ok) {
					throw `Unexpected response status ${r.status} (${r.statusText})`;
				}
				return r.json();
			});

			expect(json?.message).toEqual("Hello from Express!");
		});

		test("page route", async () => {
			await page.goto(host + "/");

			await page.waitForFunction(() =>
				document
					.querySelector("h1")
					?.textContent?.includes("Hello from Express!"),
			);
		});
	});

	describe("fastify", () => {
		initialize("fastify");

		test("API route", async () => {
			const json = await fetch(host + "/fastify").then((r) => {
				if (!r.ok) {
					throw `Unexpected response status ${r.status} (${r.statusText})`;
				}
				return r.json();
			});

			expect(json?.message).toEqual("Hello from Fastify!");
		});

		test("page route", async () => {
			await page.goto(host + "/");

			await page.waitForFunction(() =>
				document
					.querySelector("h1")
					?.textContent?.includes("Hello from Fastify!"),
			);
		});
	});

	describe("graphql", () => {
		initialize("graphql");

		test("API route", async () => {
			const json = await fetch(host + "/graphql", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					query: "{ hello }",
				}),
			}).then((r) => {
				if (!r.ok) {
					throw `Unexpected response status ${r.status} (${r.statusText})`;
				}
				return r.json();
			});

			expect(json?.data?.hello).toEqual("Hello world!");
		});

		test("page route", async () => {
			await page.goto(host + "/");

			await page.waitForFunction(() =>
				document.querySelector("pre")?.textContent?.includes(`"Hello world!"`),
			);
		});
	});

	describe("localized-urls", () => {
		initialize("localized-urls");

		test("english", async () => {
			await page.goto(host + "/en");

			await page.waitForFunction(() =>
				document.querySelector("h1")?.textContent?.includes("Hello, world!"),
			);
		});

		test("french", async () => {
			await page.goto(host + "/fr");

			await page.waitForFunction(() =>
				document
					.querySelector("h1")
					?.textContent?.includes("Bonjour, le monde !"),
			);
		});

		test("auto", async () => {
			await page.goto(host + "/");

			await page.waitForFunction(() =>
				document.querySelector("h1")?.textContent?.includes("Hello, world!"),
			);
		});
	});

	describe(
		"mantine",
		() => {
			initialize("mantine");

			test("button styles", async () => {
				await page.goto(host + "/");
				const button = (await page.waitForSelector("button"))!;
				expect(
					await button.evaluate((e) => getComputedStyle(e).borderRadius),
				).not.toBe("0px");
			});
		},
		{ retry: 3 },
	);

	describe("mdx", () => {
		initialize("mdx");

		test("page route", async () => {
			await page.goto(host + "/");

			await page.waitForFunction(() =>
				document.querySelector("h1")?.textContent?.includes("Hello world 👋"),
			);
		});
	});

	describe("react-query", () => {
		initialize("react-query");

		test(
			"page route",
			async () => {
				await page.goto(host + "/todo");
				await page.type("input:not([type])", "Hello world!");
				await page.click("input+button");

				await page.waitForFunction(() =>
					document
						.querySelectorAll("label")[2]
						?.textContent?.includes("Hello world!"),
				);
			},
			{ retry: 3 },
		);
	});

	describe("session", () => {
		initialize("session", {
			SECRET_SESSION_KEY: "xXfnGbRZbFsYH78LJ8USx6UaD21H4-42BbR3mAIQqxw",
		});

		test("sign up", async () => {
			await page.goto(host + "/sign-up");
			await page.type("[name=userName]", "John Doe");
			await page.type("[name=password]", "password");
			await page.click("button");

			await page.waitForFunction(() =>
				document.querySelector("p")?.textContent?.includes("Hi John Doe!"),
			);
		});
	});

	describe("server-sent-events", () => {
		initialize("server-sent-events");

		test("chat", async () => {
			await page.goto(host + "/");
			await page.waitForFunction(() =>
				document.querySelector("p")?.textContent?.includes("Connected"),
			);

			// Fill textarea
			await page.type("textarea", "Hello world!");

			await page.click("button");

			await page.waitForFunction(() =>
				document.querySelector("li")?.textContent?.includes("Hello world!"),
			);
		});
	});

	describe(
		"styled-components",
		() => {
			initialize("styled-components");

			test("page route", async () => {
				await page.goto(host + "/");
				const button = (await page.waitForSelector("button"))!;
				expect(
					await button.evaluate((e) => getComputedStyle(e).backgroundColor),
				).toBe("rgb(0, 68, 255)");
			});
		},
		{ retry: 3 },
	);

	describe(
		"styled-components",
		() => {
			initialize("styled-components");

			test("page route", async () => {
				await page.goto(host + "/");
				const button = (await page.waitForSelector("button"))!;
				expect(
					await button.evaluate((e) => getComputedStyle(e).backgroundColor),
				).toBe("rgb(0, 68, 255)");
			});
		},
		{ retry: 3 },
	);

	describe("tailwind", () => {
		initialize("tailwind");

		test("page route", async () => {
			await page.goto(host + "/");
			const h1 = (await page.waitForSelector("h1"))!;

			expect(await h1.evaluate((e) => getComputedStyle(e).color)).toBe(
				"rgb(239, 68, 68)",
			);
		});
	});

	describe("todo", () => {
		initialize("todo");

		test(
			"page route",
			async () => {
				await page.goto(host + "/todo");
				await page.type("input:not([type])", "Hello world!");
				await page.click("input+button");

				await page.waitForFunction(() =>
					document
						.querySelectorAll("label")[2]
						?.textContent?.includes("Hello world!"),
				);
			},
			{ retry: 3 },
		);
	});

	describe("urql", () => {
		initialize("urql");

		test("page route", async () => {
			await page.goto(host + "/");
			await page.waitForFunction(() =>
				document
					.querySelector("pre")
					?.textContent?.includes(`"name": "Millennium Falcon"`),
			);
		});
	});
});

afterAll(async () => {
	await browser.close();
});
