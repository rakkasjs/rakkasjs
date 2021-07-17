import React from "react";
import { definePage } from "rakkasjs";

export default definePage({
	Component: function RootContextPage({ context }) {
		return <p id="updated-session-value">{context.session}</p>;
	},
});
