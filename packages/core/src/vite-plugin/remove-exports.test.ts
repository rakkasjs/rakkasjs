import { describe, expect, it } from "vitest";
import { babelTransformRemoveExports } from "./remove-exports";
import { transformAsync } from "@babel/core";
import { format } from "prettier";

interface Test {
	message: string;
	input: string;
	output: string;
	keep: string[];
	_?: "only" | "skip";
}

const tests: Test[] = [
	{
		message: "function exports",
		input: `
			export const keep = 1;
			const unused = 2;
			const used = 3;

			import ssrOnly from "xxx";

			export function removeMe() {
				return used + ssrOnly();
			}
		`,
		output: `
			export const keep = 1;
			const unused = 2;
		`,
		keep: ["keep"],
	},

	{
		message: "variable exports",
		input: `
			export const keep = 1;
			const unused = 2;
			const used = 3;

			import ssrOnly from "xxx";

			export const removeMe = () => {
				return used + ssrOnly();
			}
		`,
		output: `
			export const keep = 1;
			const unused = 2;
		`,
		keep: ["keep"],
	},

	{
		message: "renamed exports",
		input: `
			const renamed = 1;
			const unused = 2;
			const used = 3;

			import ssrOnly from "xxx";

			const removeMe = () => {
				return used + ssrOnly();
			};

			export { renamed as keep, removeMe };
		`,
		output: `
			const renamed = 1;
			const unused = 2;
			export { renamed as keep };
		`,
		keep: ["keep"],
	},

	{
		message: "remove default function",
		input: `
			export const keep = 1;
			const unused = 2;
			const used = 3;

			import ssrOnly from "xxx";

			export default function removeMe() {
				return used + ssrOnly();
			};
		`,
		output: `
			export const keep = 1;
			const unused = 2;
		`,
		keep: ["keep"],
	},

	{
		message: "remove default var",
		input: `
			export const keep = 1;
			const unused = 2;
			const used = 3;

			import ssrOnly from "xxx";

			function removeMe() {
				return used + ssrOnly();
			};

			export default removeMe;
		`,
		output: `
			export const keep = 1;
			const unused = 2;
		`,
		keep: ["keep"],
	},

	{
		message: "default exports",
		input: `
			const keep = 1;
			const unused = 2;
			const used = 3;

			import ssrOnly from "xxx";

			export function removeMe() {
				return used + ssrOnly();
			}

			export default keep;
		`,
		output: `
			const keep = 1;
			const unused = 2;
			export default keep;
		`,
		keep: ["default"],
	},

	{
		message: "default exports 2",
		input: `
			const keep = 1;
			const unused = 2;
			const used = 3;

			import ssrOnly from "xxx";

			export function removeMe() {
				return used + ssrOnly();
			}

			export { keep as default }
		`,
		output: `
			const keep = 1;
			const unused = 2;
			export { keep as default }
		`,
		keep: ["default"],
	},
];

describe("Transform client-side pages", () => {
	for (const test of tests) {
		// eslint-disable-next-line no-only-tests/no-only-tests
		const f = test._ === "skip" ? it.skip : test._ === "only" ? it.only : it;

		f(test.message, async () => {
			const result = await transformAsync(trim(test.input), {
				parserOpts: { plugins: ["jsx", "typescript"] },
				plugins: [babelTransformRemoveExports(test.keep)],
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
