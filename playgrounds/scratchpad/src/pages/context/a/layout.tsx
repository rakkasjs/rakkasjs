import { defineLayout, DefineLayoutTypes, LayoutContext } from "rakkasjs";
import { OuterLayoutTypes } from "../layout";

export type InnerALayoutTypes = DefineLayoutTypes<{
	parentContext: LayoutContext<OuterLayoutTypes>;
	contextOverrides: { inner: string };
}>;

export default defineLayout<InnerALayoutTypes>({
	load() {
		return {
			data: undefined,
			context: { inner: "INNER-A" },
		};
	},
});
