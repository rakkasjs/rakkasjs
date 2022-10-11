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
			import { useSSQ, runSSM } from "rakkasjs";
			import { someValue } from "./some-module";
			const bar = 1;

			function outside() {}

			function x(foo) {
				const baz = 2;
				useSSQ(() => foo + bar + baz, { option: "qux" });
				useSSQ(async function (ctx) {
					const baz = 2;
					return ctx.session.userName;
				});
				useSSQ(outside);
				useSSQ(() => baz);
				useSSQ(() => someValue);
				runSSM(() => { void 0; });
			}
		`,
		output: `
			import { useSSQ } from "rakkasjs";
			import { someValue } from "./some-module";
			const bar = 1;
			function outside() {}
			function x(foo) {
				const baz = 2;
				useSSQ(["abc123", 0, [foo, baz], $runServerSide$[0]], { option: "qux" });
				useSSQ(["abc123", 1, [], $runServerSide$[1]]);
				useSSQ(["abc123", 2, [], $runServerSide$[2]]);
				useSSQ(["abc123", 3, [baz], $runServerSide$[3]]);
				useSSQ(["abc123", 4, [], $runServerSide$[4]]);
				null;
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
				},
				async ($runServerSideClosure$, ...$runServerSideArgs$) => {
					let [] = $runServerSideClosure$;
					return outside(...$runServerSideArgs$);
				},
				async ($runServerSideClosure$) => {
					let [baz] = $runServerSideClosure$;
					return baz;
				},
				async ($runServerSideClosure$) => {
					let [] = $runServerSideClosure$;
					return someValue;
				},
				async ($runServerSideClosure$) => {
					let [] = $runServerSideClosure$;
					void 0;
				},
			]
		`,
	},
	{
		message: "passes useSSM vars",
		input: `
			import { useSSM } from "rakkasjs";

			function x(foo) {
				useSSM((ctx, vars) => { console.log(vars, foo) });
			}
		`,
		output: `
			import { useSSM } from "rakkasjs";

			function x(foo) {
				useSSM(["abc123", 0, [foo], $runServerSide$[0]]);
			}

			export const $runServerSide$ = [
				async ($runServerSideClosure$, ctx, vars) => {
					let [foo] = $runServerSideClosure$;
					console.log(vars, foo)
				},
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

		const output = trim(result?.code || "");
		expect(output).to.equal(trim(test.output));
	});
}

function trim(c: string): string {
	return format(c.replace(/(\s|\n|\r)+/g, " ").trim(), {
		filepath: "test.tsx",
	});
}
