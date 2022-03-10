import { describe, test, expect } from "vitest";
import { routeToRegExp, sortRoutes } from "./route-utils";

describe("routeToRegExp", () => {
	test("matches simple routes", () => {
		const re = routeToRegExp("/foo");
		expect(re.exec("/foo")).toBeTruthy();
		expect(re.exec("/foo/")).toBeTruthy();
	});

	test("matches params", () => {
		const re = routeToRegExp("/foo/[bar]");
		expect("/foo/123/".match(re)?.groups).toMatchObject({
			bar: "123",
		});
	});

	test("matches multiple params in one segment", () => {
		const re = routeToRegExp("/foo/[bar]-[baz]");
		expect("/foo/123-456".match(re)?.groups).toMatchObject({
			bar: "123",
			baz: "456",
		});
	});

	test("ignores index and underscore", () => {
		const re = routeToRegExp("/foo/_bar/baz/index");
		expect("/foo/baz".match(re)).toBeTruthy();
	});
});

describe("sortRoutes", () => {
	test("specific before generic", () => {
		expect(
			sortRoutes([
				["/foo/[bar]", 1],
				["/foo/[baz]-[qux]", 2],
				["/foo/xyz/", 3],
			]),
		).toMatchObject([
			["/foo/xyz/", 3],
			["/foo/[bar]", 1],
			["/foo/[baz]-[qux]", 2],
		]);
	});
});
