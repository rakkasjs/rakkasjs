import { defineLayout, DefineLayoutTypesUnder } from "rakkasjs";
import { OuterLayoutTypes } from "../layout";

export type InnerALayoutTypes = DefineLayoutTypesUnder<
	OuterLayoutTypes,
	{
		contextOverrides: { inner: string };
	}
>;

export default defineLayout<InnerALayoutTypes>({
	load() {
		return {
			data: undefined,
			context: { inner: "INNER-A" },
		};
	},
});
