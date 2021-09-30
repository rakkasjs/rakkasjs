import React from "react";
import { definePage, DefinePageTypesUnder } from "rakkasjs";
import { InnerALayoutTypes } from "./layout";

type ContextTestPageTypes = DefinePageTypesUnder<InnerALayoutTypes>;

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
