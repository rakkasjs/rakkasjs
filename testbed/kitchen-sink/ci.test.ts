/// <reference types="vite/client" />

import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "child_process";
import fetch from "node-fetch";
import path from "path";
// @ts-expect-error: kill-port doesn't ship with types
import kill from "kill-port";

const TEST_HOST = import.meta.env.TEST_HOST || "http://localhost:3000";

if (import.meta.env.TEST_HOST) {
	testCase("running server");
} else {
	testCase("development mode", "pnpm dev");
	testCase("production mode", "pnpm build && pnpm start");
}

function testCase(title: string, command?: string) {
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
	});
}

afterAll(async () => {
	await kill(3000, "tcp");
});
