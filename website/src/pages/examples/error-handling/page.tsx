import React from "react";
import { definePage } from "rakkasjs";

export default definePage({
	load() {
		return {
			error: {
				message: "Something bad happened!",
			},
		};
	},

	Component: function ErrorPage() {
		return <p>This will never render.</p>;
	},
});
