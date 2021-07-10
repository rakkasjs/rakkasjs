import React from "react";
import { definePage } from "rakkasjs";

export default definePage({
	options: { canHandleErrors: true },

	Component: function MainPage({ error }) {
		if (error) {
			return (
				<main>
					<p>{error.message}</p>
				</main>
			);
		}

		return (
			<main>
				<h1>Hello world!</h1>
			</main>
		);
	},
});
