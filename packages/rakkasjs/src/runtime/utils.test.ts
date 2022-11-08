import { test, expect } from "vitest";
import { encodeFileNameSafe, decodeFileNameSafe } from "./utils";

test("encodes and decodes file name safe strings", () => {
	const s = JSON.stringify({ hello: "world 😊" });
	const encoded = encodeFileNameSafe(s);

	for (const char of encoded) {
		expect(char).toMatch(/[a-zA-F0-9_]/);
	}

	const decoded = decodeFileNameSafe(encoded);

	expect(decoded).toBe(s);
});
