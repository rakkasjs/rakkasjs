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
				useSSQ(["dev/abc123/0", [foo, baz]], { option: "qux" });
				useSSQ(["dev/abc123/1", []]);
				useSSQ(["dev/abc123/2", []]);
				useSSQ(["dev/abc123/3", [baz]]);
				useSSQ(["dev/abc123/4", []]);
				runSSM(["dev/abc123/5", [baz]]);
			};
		`,
	},
	{
		message: "honors buildId and uniqueId",
		input: `
			import { runSSM } from "rakkasjs";

			function x(foo) {
				runSSM(() => { console.log("foo"); }, { uniqueId: "foo" });
			}
		`,
		output: `
			import { runSSM } from "rakkasjs";

			function x(foo) {
				runSSM(["id/foo", []], { uniqueId: "foo" });
			};
		`,
	},
];

for (const test of tests) {
	// eslint-disable-next-line no-only-tests/no-only-tests
	const f = test._ === "skip" ? it.skip : test._ === "only" ? it.only : it;

	f(test.message, async () => {
		const result = await transformAsync(await trim(test.input), {
			parserOpts: { plugins: ["jsx", "typescript"] },
			plugins: [
				babelTransformClientSideHooks({
					moduleId: "dev/abc123",
					modified: false,
					uniqueIds: [],
				}),
			],
		});

		expect(await trim(result?.code || "")).to.equal(await trim(test.output));
	});
}

async function trim(c: string): Promise<string> {
	return format(c.replace(/(\s|\n|\r)+/g, " ").trim(), {
		filepath: "test.tsx",
	});
}
