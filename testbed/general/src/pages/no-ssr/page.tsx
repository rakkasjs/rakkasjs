import React from "react";
import { definePage } from "rakkasjs";

export default definePage({
	Component: function NoSsr() {
		return <p>This page is rendered on the client-side.</p>;
	},
	options: { ssr: false },
});
