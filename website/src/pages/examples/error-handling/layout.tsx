import React from "react";
import { defineLayout } from "rakkasjs";

export default defineLayout({
	Component: function ErrorHandlingLayout(props) {
		return (
			<div>
				{/* If there's an error, render it */}
				{props.error && (
					<p style={{ color: "red" }}>Error: {props.error.message}</p>
				)}

				{/* Otherwise render normally */}
				{props.children}
			</div>
		);
	},
});
