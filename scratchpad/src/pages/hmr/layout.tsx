import React from "react";
import { defineLayout } from "rakkasjs";

export default defineLayout({
	Component: function HmrLayout({ error, children }) {
		return (
			<>
				<p>This is the HMR test layout</p>
				<div id="page-content">
					{error && error.message}
					{children}
				</div>
			</>
		);
	},
});
