import { describe, expect, it } from "vitest";
import { babelTransformClientSidePages } from "./transform-client-page";
import { transformAsync } from "@babel/core";
import { format } from "prettier";

interface Test {
	message: string;
	input: string;
	output: string;
	_?: "only" | "skip";
}

const tests: Test[] = [
	{
		message: "function exports",
		input: `
			export const normal = 1;
			const unused = 2;
			const used = 3;

			import ssrOnly from "xxx";

			export function headers() {
				return used + ssrOnly();
			}
		`,
		output: `
			export const normal = 1;
			const unused = 2;
		`,
	},

	{
		message: "variable exports",
		input: `
			export const normal = 1;
			const unused = 2;
			const used = 3;

			import ssrOnly from "xxx";

			export const headers = () => {
				return used + ssrOnly();
			}
		`,
		output: `
			export const normal = 1;
			const unused = 2;
		`,
	},

	{
		message: "renamed exports",
		input: `
			export const normal = 1;
			const unused = 2;
			const used = 3;

			import ssrOnly from "xxx";

			const h = () => {
				return used + ssrOnly();
			};

			export { h as headers };
		`,
		output: `
			export const normal = 1;
			const unused = 2;
			export {};
		`,
	},
];

describe("Transform client-side pages", () => {
	for (const test of tests) {
		// eslint-disable-next-line no-only-tests/no-only-tests
		const f = test._ === "skip" ? it.skip : test._ === "only" ? it.only : it;

		f(test.message, async () => {
			const result = await transformAsync(trim(test.input), {
				parserOpts: { plugins: ["jsx", "typescript"] },
				plugins: [babelTransformClientSidePages()],
			});

			expect(trim(result?.code || "")).to.equal(trim(test.output));
		});
	}
});

function trim(c: string): string {
	return format(c.replace(/(\s|\n|\r)+/g, " ").trim(), {
		filepath: "test.tsx",
	});
}
