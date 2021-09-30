import React from "react";
import { definePage, DefinePageTypesUnder } from "rakkasjs";
import { InnerBLayoutTypes } from "./layout";

type ContextTestPageTypes = DefinePageTypesUnder<InnerBLayoutTypes>;

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
