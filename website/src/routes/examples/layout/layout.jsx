import React from "react";
import { StyledLink } from "rakkasjs";

const MainLayout = ({ children }) => (
	<div>
		<header>Shared header</header>
		<nav>
			<StyledLink href="/examples/layout" activeStyle={{ fontWeight: "bold" }}>
				Home
			</StyledLink>{" "}
			|{" "}
			<StyledLink
				href="/examples/layout/about"
				activeStyle={{ fontWeight: "bold" }}
			>
				About
			</StyledLink>
		</nav>
		<hr />
		<div style={{ padding: "1rem", background: "#ddd" }}>{children}</div>
		<hr />
		<footer>Shared footer</footer>
	</div>
);

export default MainLayout;
