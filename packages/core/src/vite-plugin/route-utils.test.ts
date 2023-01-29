import { describe, test, expect } from "vitest";
import { routeToRegExp, sortRoutes } from "./route-utils";

describe("routeToRegExp", () => {
	test("matches simple routes", () => {
		const [re] = routeToRegExp("/foo");
		expect(re.exec("/foo")).toBeTruthy();
		expect(re.exec("/foo/")).toBeTruthy();
	});

	test("escapes special characters", () => {
		const [re] = routeToRegExp("/foo.json");
		expect(re.exec("/foo.json")).toBeTruthy();
		expect(re.exec("/fooXjson")).toBeFalsy();
	});

	test("matches params", () => {
		const [re] = routeToRegExp("/foo/[bar]");
		expect("/foo/123/".match(re)?.groups).toMatchObject({
			bar: "123",
		});
	});

	test("matches multiple params in one segment", () => {
		const [re] = routeToRegExp("/foo/[bar]-[baz]");
		expect("/foo/123-456".match(re)?.groups).toMatchObject({
			bar: "123",
			baz: "456",
		});
	});

	test("ignores index, underscore, and brackets", () => {
		const [re] = routeToRegExp("/foo/_bar/baz/(qux)/index");
		expect("/foo/baz".match(re)).toBeTruthy();
	});

	test("matches rest params", () => {
		const [re] = routeToRegExp("/foo/[bar]/[baz]/[...qux]");
		expect("/foo/123/456/aaa/bbb/ccc".match(re)?.groups).toMatchObject({
			bar: "123",
			baz: "456",
			qux: "/aaa/bbb/ccc",
		});

		expect("/foo/123/456".match(re)?.groups).toMatchObject({
			bar: "123",
			baz: "456",
			qux: "",
		});
	});
});

describe("sortRoutes", () => {
	test("specific before generic", () => {
		expect(
			sortRoutes([
				{ path: "/foo/[bar]", payload: 1 },
				{ path: "/foo/[bar]/[...qux]", payload: 2 },
				{ path: "/foo/[baz]-[qux]", payload: 3 },
				{ path: "/foo/xyz/", payload: 4 },
			]),
		).toMatchObject([
			{ path: "/foo/xyz/", payload: 4 },
			{ path: "/foo/[bar]", payload: 1 },
			{ path: "/foo/[baz]-[qux]", payload: 3 },
			{ path: "/foo/[bar]/[...qux]", payload: 2 },
		]);
	});
});
