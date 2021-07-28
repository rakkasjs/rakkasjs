import React from "react";
import { defineLayout } from "rakkasjs";

export default defineLayout({
	Component: function MainLayout({ error, children }) {
		if (error) {
			return (
				<main>
					<p>{error.message}</p>
				</main>
			);
		}

		return <>{children}</>;
	},
});
