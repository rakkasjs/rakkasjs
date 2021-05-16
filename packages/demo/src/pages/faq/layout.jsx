import { NavLink } from "@rakkasjs/core";
import React from "react";

export default ({ children }) => {
	const currentStyle = {
		background: "#333",
		color: "#eee",
	};

	return (
		<>
			<p>
				This menu is defined in a nested layout. It's common to all /faq/*
				pages.
			</p>
			<nav>
				<ul>
					<li>
						<NavLink
							href="/faq/what-is-rakkas"
							currentRouteStyle={currentStyle}
						>
							What is Rakkas?
						</NavLink>
					</li>
					<li>
						<NavLink
							href="/faq/why-another-react-framework"
							currentRouteStyle={currentStyle}
						>
							Why another React framework?
						</NavLink>
					</li>
					<li>
						<NavLink
							href="/faq/when-will-it-be-ready"
							currentRouteStyle={currentStyle}
						>
							When will it be ready?
						</NavLink>
					</li>
				</ul>
			</nav>
			<hr />
			<h1>Frequently Asked Questions</h1>
			{children}
		</>
	);
};
