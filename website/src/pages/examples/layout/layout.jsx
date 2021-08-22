import React from "react";
import { NavLink } from "rakkasjs";

const MainLayout = ({ children }) => (
	<div>
		<header>Shared header</header>
		<nav>
			<NavLink
				href="/examples/layout"
				currentRouteStyle={{ fontWeight: "bold" }}
			>
				Home
			</NavLink>{" "}
			|{" "}
			<NavLink
				href="/examples/layout/about"
				currentRouteStyle={{ fontWeight: "bold" }}
			>
				About
			</NavLink>
		</nav>
		<hr />
		<div style={{ padding: "1rem", background: "#ddd" }}>{children}</div>
		<hr />
		<footer>Shared footer</footer>
	</div>
);

export default MainLayout;
