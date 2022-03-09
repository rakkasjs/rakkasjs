import { test, expect } from "vitest";
import { routeToRegExp } from "./route-to-reg-exp";

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
