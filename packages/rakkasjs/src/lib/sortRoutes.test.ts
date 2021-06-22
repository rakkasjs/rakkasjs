import { splitIntoSubSegments, sortRoutes } from "./sortRoutes";

describe("Parses subsegments", () => {
	it("splits subsegment correctly", () => {
		expect(splitIntoSubSegments("[xyz]")).toStrictEqual(["[xyz]"]);
		expect(splitIntoSubSegments("[xyz].abc")).toStrictEqual(["[xyz]", ".abc"]);
		expect(splitIntoSubSegments("[xyz]-[abc]")).toStrictEqual([
			"[xyz]",
			"-",
			"[abc]",
		]);
	});
});

describe("Sorts routes", () => {
	it("orders parametric after specific", () => {
		const sorted = sortRoutes(
			["/[parametric]", "/specific"].map((x) => ({ pattern: x, extra: null })),
		);

		expect(sorted.map((x) => x.pattern)).toStrictEqual([
			"/specific",
			"/[parametric]",
		]);
	});

	it("orders short before long", () => {
		const sorted = sortRoutes(
			["/a/b", "/a"].map((x) => ({ pattern: x, extra: null })),
		);

		expect(sorted.map((x) => x.pattern)).toStrictEqual(["/a", "/a/b"]);

		const sorted2 = sortRoutes(
			["/a", "/a/b"].map((x) => ({ pattern: x, extra: null })),
		);

		expect(sorted2.map((x) => x.pattern)).toStrictEqual(["/a", "/a/b"]);
	});

	it("orders alphabetically", () => {
		const sorted = sortRoutes(
			["/b", "/a"].map((x) => ({ pattern: x, extra: null })),
		);

		expect(sorted.map((x) => x.pattern)).toStrictEqual(["/a", "/b"]);
	});

	it("orders more placeholders before fewer", () => {
		const sorted = sortRoutes(
			["/[a]-[b]", "/[a]"].map((x) => ({ pattern: x, extra: null })),
		);

		expect(sorted.map((x) => x.pattern)).toStrictEqual(["/[a]-[b]", "/[a]"]);

		const sorted2 = sortRoutes(
			["/[a]", "/[a]-[b]"].map((x) => ({ pattern: x, extra: null })),
		);

		expect(sorted2.map((x) => x.pattern)).toStrictEqual(["/[a]-[b]", "/[a]"]);
	});

	it("generates correct regexp", () => {
		const sorted = sortRoutes(
			["/[a]-[b]/something/[c].json"].map((x) => ({ pattern: x, extra: null })),
		);

		expect(
			Array.from("/foo-bar/something/spam.json".match(sorted[0].regexp)!).slice(
				1,
			),
		).toStrictEqual(["foo", "bar", "spam"]);
	});

	it("generates correct parameter names", () => {
		const sorted = sortRoutes(
			["/[a]-[b]/something/[c].json"].map((x) => ({ pattern: x, extra: null })),
		);

		expect(sorted[0].paramNames).toStrictEqual(["a", "b", "c"]);
	});
});
