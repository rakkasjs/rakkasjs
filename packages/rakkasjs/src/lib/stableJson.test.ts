import { hash } from "./hash";

describe("Stable serialize", () => {
	const original = {
		a: true,
		b: 42,
		c: "foobar",
		d: null,
		e: [1, null, "z", false],
		f: {
			g: "ggg",
			h: "hhh",
		},
	};

	const mixed = {
		b: 42,
		a: true,
		c: "foobar",
		e: [1, null, "z", false],
		d: null,
		f: {
			h: "hhh",
			g: "ggg",
		},
	};

	it("hashes in a stable way", () => {
		const s1 = hash(original);
		const s2 = hash(mixed);
		expect(s1).toBe(s2);
	});
});
