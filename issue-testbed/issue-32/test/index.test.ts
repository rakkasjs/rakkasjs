import { afterAll, beforeAll, test, expect } from "vitest";
import { ChildProcess, spawn } from "child_process";
import fetch from "node-fetch";
import path from "path";
import kill from "kill-port";

let rakkas: ChildProcess;

beforeAll(async () => {
	rakkas = spawn("pnpm run dev", {
		shell: true,
		stdio: "inherit",
		cwd: path.resolve(__dirname, ".."),
	});

	// Wait until page renders correctly
	await new Promise<void>((resolve) => {
		const interval = setInterval(() => {
			fetch("http://localhost:3000")
				.then(async (r) => {
					const text = await r.text();
					if (r.status === 200 && text.includes("Rakkas Demo App")) {
						clearInterval(interval);
						resolve();
						console.log(await r.text());
					}
				})
				.catch(() => {});
		}, 250);
	});
}, 30_000);

test("resolves virtual entry", async () => {
	const response = await fetch(
		"http://localhost:3000/virtual:rakkasjs:start-client.js",
	);
	expect(response.status).toBe(200);
	const text = await response.text();
	expect(text).toContain("import");
});

afterAll(async () => {
	await kill(3000, "tcp");
});
