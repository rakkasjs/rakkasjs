import { expect, it } from "vitest";
import { babelTransformServerSideHooks } from "./transform-server-side";
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
		message: "transforms server-side code",
		input: `
			import { useSSQ } from "rakkasjs";
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
			const bar = 1;
			function x(foo) {
				const baz = 2;
				useSSQ(["abc123", 0, [foo, baz], $runServerSide$[0]], { option: "qux" });
				useSSQ(["abc123", 1, [], $runServerSide$[1]]);
			};

			export const $runServerSide$ = [
				async ($runServerSideClosure$) => {
					let [foo, baz] = $runServerSideClosure$;
					return foo + bar + baz;
				},
				async function ($runServerSideClosure$, ctx) {
					let [] = $runServerSideClosure$;
					const baz = 2;
					return ctx.session.userName;
				}
			]
		`,
	},
];

for (const test of tests) {
	// eslint-disable-next-line no-only-tests/no-only-tests
	const f = test._ === "skip" ? it.skip : test._ === "only" ? it.only : it;

	f(test.message, async () => {
		const result = await transformAsync(trim(test.input), {
			parserOpts: { plugins: ["jsx", "typescript"] },
			plugins: [babelTransformServerSideHooks("abc123")],
		});

		expect(trim(result?.code || "")).to.equal(trim(test.output));
	});
}

function trim(c: string): string {
	return format(c.replace(/(\s|\n|\r)+/g, " ").trim(), {
		filepath: "test.tsx",
	});
}
