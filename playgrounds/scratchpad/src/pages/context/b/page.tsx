import React from "react";
import { definePage, DefinePageTypes, LayoutContext } from "rakkasjs";
import { InnerBLayoutTypes } from "./layout";

type ContextTestPageTypes = DefinePageTypes<{
	parentContext: LayoutContext<InnerBLayoutTypes>;
}>;

export default definePage<ContextTestPageTypes>({
	Component: function ContextTestPage({ context }) {
		return (
			<>
				<p className="outer">{context.outer}</p>
				<p className="inner">{context.inner}</p>
			</>
		);
	},
});
