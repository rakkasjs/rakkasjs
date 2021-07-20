import React from "react";
import { defineLayout } from "rakkasjs";

export default defineLayout({
	Component: function FsWatchLayout({ error, children }) {
		return (
			<>
				<p>This is the FS watch test layout</p>
				<div id="page-content">
					{error && error.message}
					{children}
				</div>
			</>
		);
	},
});
