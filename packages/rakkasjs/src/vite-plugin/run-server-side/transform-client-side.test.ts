import { expect, it } from "vitest";
import { babelTransformClientSideHooks } from "./transform-client-side";
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
		message: "transforms client-side code",
		input: `
			import { useSSQ } from "rakkasjs";
			import { alreadyUnused } from "other-server-side";

			const bar = 1;
			function x(foo) {
				const baz = 2;
				useSSQ(() => foo + bar + baz, { option: "qux" });
				useSSQ(async function (ctx) {
					const baz = 2;
					return ctx.session.userName;
				});
			}
		`,
		output: `
			import { useSSQ } from "rakkasjs";
			import { alreadyUnused } from "other-server-side";

			function x(foo) {
				const baz = 2;
				useSSQ(["abc123", 0, [foo, baz]], { option: "qux" });
				useSSQ(["abc123", 1, []]);
			};
		`,
	},
];

for (const test of tests) {
	// eslint-disable-next-line no-only-tests/no-only-tests
	const f = test._ === "skip" ? it.skip : test._ === "only" ? it.only : it;

	f(test.message, async () => {
		const result = await transformAsync(trim(test.input), {
			parserOpts: { plugins: ["jsx", "typescript"] },
			plugins: [babelTransformClientSideHooks("abc123", { current: false })],
		});

		expect(trim(result?.code || "")).to.equal(trim(test.output));
	});
}

function trim(c: string): string {
	return format(c.replace(/(\s|\n|\r)+/g, " ").trim(), {
		filepath: "test.tsx",
	});
}
