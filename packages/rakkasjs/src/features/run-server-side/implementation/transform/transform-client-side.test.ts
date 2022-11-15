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
			import { useSSQ, runSSM } from "rakkasjs";
			import { sharedFn } from "shared-module";
			import { serverSideFn, serverSideVar } from "server-side-module";
			import { alreadyUnused } from "other-server-side";

			const bar = 1;

			function outside() {}

			function serverOnlyFn() {
				serverSideFn();
			}

			function x(foo) {
				const baz = 2;
				sharedFn();
				useSSQ(() => foo + bar + baz, { option: "qux" });
				useSSQ(async function (ctx) {
					const baz = 2;
					serverOnlyFn();
					serverSideFn();
					sharedFn();
					return ctx.session.userName;
				});
				useSSQ(outside);
				useSSQ(() => baz);
				useSSQ(() => serverSideVar);
				runSSM(() => { void baz; })
			}
		`,
		output: `
			import { useSSQ, runSSM } from "rakkasjs";
			import { sharedFn } from "shared-module";
			import { alreadyUnused } from "other-server-side";

			function x(foo) {
				const baz = 2;
				sharedFn();
				useSSQ(["abc123", 0, [foo, baz]], { option: "qux" });
				useSSQ(["abc123", 1, []]);
				useSSQ(["abc123", 2, []]);
				useSSQ(["abc123", 3, [baz]]);
				useSSQ(["abc123", 4, []]);
				runSSM(["abc123", 5, [baz]]);
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
