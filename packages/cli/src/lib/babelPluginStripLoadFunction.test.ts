import { describe, it, expect } from "vitest";
import { babelPluginStripLoadFunction } from "./babelPluginStripLoadFunction";
import { transformAsync } from "@babel/core";

describe("Babel plugin for stripping load and getCacheKey from static builds", () => {
	it("strips load", async () => {
		const { code } = (await transformAsync(
			`definePage({async load(){return "stripped"},Component:()=>null})`,
			{
				plugins: [babelPluginStripLoadFunction()],
			},
		))!;

		expect(code).not.toContain("load");
		expect(code).not.toContain("stripped");
		expect(code).toContain("Component");
	});

	it("strips getCacheKey", async () => {
		const { code } = (await transformAsync(
			`defineLayout({getCacheKey:()=>"stripped"})`,
			{
				plugins: [babelPluginStripLoadFunction()],
			},
		))!;

		expect(code).not.toContain("getCacheKey");
		expect(code).not.toContain("stripped");
	});
});
