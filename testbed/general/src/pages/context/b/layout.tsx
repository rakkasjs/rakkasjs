import { defineLayout, DefineLayoutTypesUnder } from "rakkasjs";
import { OuterLayoutTypes } from "../layout";

export type InnerBLayoutTypes = DefineLayoutTypesUnder<
	OuterLayoutTypes,
	{
		contextOverrides: { inner: string };
	}
>;

export default defineLayout<InnerBLayoutTypes>({
	load() {
		return {
			data: undefined,
			context: { inner: "INNER-B" },
		};
	},
});
