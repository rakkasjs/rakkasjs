import { describe, it, expect } from "vitest";
import { splitIntoSubSegments, sortRoutes } from "./sortRoutes";

describe("Parses subsegments", () => {
	it("splits subsegment correctly", () => {
		expect(splitIntoSubSegments("[xyz]")).toMatchObject(["[xyz]"]);
		expect(splitIntoSubSegments("[xyz].abc")).toMatchObject(["[xyz]", ".abc"]);
		expect(splitIntoSubSegments("[xyz]-[abc]")).toMatchObject([
			"[xyz]",
			"-",
			"[abc]",
		]);
	});
});

describe("Sorts routes", () => {
	it("orders parametric after specific", () => {
		const sorted = sortRoutes(
			["/[parametric]", "/specific"].map((x) => ({
				pattern: x,
				content: null,
			})),
		);

		expect(sorted.map((x) => x.pattern)).toMatchObject([
			"/specific",
			"/[parametric]",
		]);
	});

	it("orders short before long", () => {
		const sorted = sortRoutes(
			["/a/b", "/a"].map((x) => ({ pattern: x, content: null })),
		);

		expect(sorted.map((x) => x.pattern)).toMatchObject(["/a", "/a/b"]);

		const sorted2 = sortRoutes(
			["/a", "/a/b"].map((x) => ({ pattern: x, content: null })),
		);

		expect(sorted2.map((x) => x.pattern)).toMatchObject(["/a", "/a/b"]);
	});

	it("orders alphabetically", () => {
		const sorted = sortRoutes(
			["/b", "/a"].map((x) => ({ pattern: x, content: null })),
		);

		expect(sorted.map((x) => x.pattern)).toMatchObject(["/a", "/b"]);
	});

	it("orders more placeholders before fewer", () => {
		const sorted = sortRoutes(
			["/[a]-[b]", "/[a]"].map((x) => ({ pattern: x, content: null })),
		);

		expect(sorted.map((x) => x.pattern)).toMatchObject(["/[a]-[b]", "/[a]"]);

		const sorted2 = sortRoutes(
			["/[a]", "/[a]-[b]"].map((x) => ({ pattern: x, content: null })),
		);

		expect(sorted2.map((x) => x.pattern)).toMatchObject(["/[a]-[b]", "/[a]"]);
	});

	it("generates correct regexp", () => {
		const sorted = sortRoutes(
			["/[a]-[b]/something/[c].json"].map((x) => ({
				pattern: x,
				content: null,
			})),
		);

		expect(
			Array.from("/foo-bar/something/spam.json".match(sorted[0].regexp)!).slice(
				1,
			),
		).toMatchObject(["foo", "bar", "spam"]);
	});

	it("generates correct parameter names", () => {
		const sorted = sortRoutes(
			["/[a]-[b]/something/[c].json"].map((x) => ({
				pattern: x,
				content: null,
			})),
		);

		expect(sorted[0].paramNames).toMatchObject(["a", "b", "c"]);
	});
});
