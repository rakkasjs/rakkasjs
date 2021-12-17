import React, { useEffect } from "react";
import { defineLayout, StyledLink } from "rakkasjs";

export default defineLayout({
	Component: function MainLayout({ error, children }) {
		useEffect(() => {
			document.body.classList.add("hydrated");
		}, []);

		const content = error || children;

		return (
			<div>
				<main>{content}</main>
				<nav>
					<ul>
						<li>
							<StyledLink href="/" activeStyle={{ fontWeight: "bold" }}>
								Home page
							</StyledLink>
						</li>
						<li>
							<StyledLink href="/other" activeStyle={{ fontWeight: "bold" }}>
								Other page
							</StyledLink>
						</li>
					</ul>
				</nav>
			</div>
		);
	},
});
