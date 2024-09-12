import { test, expect } from "vitest";
import { urlPrefixToRegExp } from "./prefix-to-regexp";

test("http", () => {
	const re = urlPrefixToRegExp("http://example.com");
	expect(re.exec("http://example.com/")).toBeTruthy();
	expect(re.exec("http://example.com/test")).toBeTruthy();
	expect(re.exec("https://example.com/")).toBeFalsy();
});

test("https", () => {
	const re = urlPrefixToRegExp("https://example.com");
	expect(re.exec("https://example.com")).toBeTruthy();
	expect(re.exec("https://example.com/")).toBeTruthy();
	expect(re.exec("https://example.com/test")).toBeTruthy();
	expect(re.exec("http://example.com/")).toBeFalsy();
});

test("wildcard protocol", () => {
	const re = urlPrefixToRegExp("*://example.com");
	expect(re.exec("http://example.com")).toBeTruthy();
	expect(re.exec("http://example.com/")).toBeTruthy();
	expect(re.exec("http://example.com/test")).toBeTruthy();
	expect(re.exec("https://example.com/")).toBeTruthy();
	expect(re.exec("https://example.com/test")).toBeTruthy();
	expect(re.exec("ftp://example.com/")).toBeFalsy();
});

test("single wildcard subdomain", () => {
	const re = urlPrefixToRegExp("http://*.example.com");
	expect(re.exec("http://foo.example.com")).toBeTruthy();
	expect(re.exec("http://bar.example.com")).toBeTruthy();
	expect(re.exec("http://example.com")).toBeFalsy();
	expect(re.exec("http://foo.bar.example.com")).toBeFalsy();
});

test("double wildcard subdomain", () => {
	const re = urlPrefixToRegExp("http://**.example.com");
	expect(re.exec("http://foo.example.com")).toBeTruthy();
	expect(re.exec("http://bar.example.com")).toBeTruthy();
	expect(re.exec("http://example.com")).toBeFalsy();
	expect(re.exec("http://foo.bar.example.com")).toBeTruthy();
});

test("path", () => {
	const re = urlPrefixToRegExp("http://example.com/test");
	expect(re.exec("http://example.com/test")).toBeTruthy();
	expect(re.exec("http://example.com/testxyz")).toBeTruthy();
	expect(re.exec("http://example.com/test/")).toBeTruthy();
	expect(re.exec("http://example.com/test/foo")).toBeTruthy();
	expect(re.exec("http://example.com/")).toBeFalsy();
	expect(re.exec("http://example.com")).toBeFalsy();
});

test("path with trailing slash", () => {
	const re = urlPrefixToRegExp("http://example.com/test/");
	expect(re.exec("http://example.com/test")).toBeFalsy();
	expect(re.exec("http://example.com/test/")).toBeTruthy();
	expect(re.exec("http://example.com/test/foo")).toBeTruthy();
	expect(re.exec("http://example.com/testxyz")).toBeFalsy();
});

test("invalid pattern", () => {
	expect(() => urlPrefixToRegExp("ftp://example.com")).toThrow();
	expect(() => urlPrefixToRegExp("http://*.example.com*")).toThrow();
	expect(() => urlPrefixToRegExp("http://example.com/*")).toThrow();
});
