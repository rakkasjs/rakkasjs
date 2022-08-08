import React from "react";
import { LayoutProps, StyledLink } from "rakkasjs";

export default function MainLayout({ children }: LayoutProps) {
	return (
		<div>
			<header>
				<p>Shared header</p>
			</header>

			<nav>
				<StyledLink href="/layout" activeStyle={{ fontWeight: "bold" }}>
					Home
				</StyledLink>{" "}
				|{" "}
				<StyledLink href="/layout/about" activeStyle={{ fontWeight: "bold" }}>
					About
				</StyledLink>
			</nav>
			<hr />
			<div style={{ padding: "1rem", background: "#ddd" }}>{children}</div>
			<hr />
			<footer>Shared footer</footer>
		</div>
	);
}
