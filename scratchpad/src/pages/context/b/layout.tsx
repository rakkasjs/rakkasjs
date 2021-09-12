import { defineLayout, DefineLayoutTypes, LayoutContext } from "rakkasjs";
import { OuterLayoutTypes } from "../layout";

export type InnerBLayoutTypes = DefineLayoutTypes<{
	parentContext: LayoutContext<OuterLayoutTypes>;
	contextOverrides: { inner: string };
}>;

export default defineLayout<InnerBLayoutTypes>({
	load() {
		return {
			data: undefined,
			context: { inner: "INNER-B" },
		};
	},
});
