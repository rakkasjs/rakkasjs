import React from "react";
import { defineLayout } from "rakkasjs";

export default defineLayout({
	Component: function HmrLayout({ error, children }) {
		return (
			<>
				<p id="layout-p">HMR test layout - ORIGINAL</p>
				<div>
					{error && error.message}
					{children}
				</div>
			</>
		);
	},
});
