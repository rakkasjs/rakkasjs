import React from "react";
import { NavLink, useRouter } from "@rakkasjs/core";
import "./App.css";

export default ({ children }) => {
	const { current } = useRouter();
	console.log("Path:", current.pathname);

	return (
		<div className="app">
			<nav>
				<ul>
					<li>
						<NavLink href="/" currentRouteClass="active-link">
							Home
						</NavLink>
					</li>
					<li>
						<NavLink href="/blog" currentRouteClass="active-link">
							Blog
						</NavLink>
					</li>
					<li>
						<NavLink href="/about" currentRouteClass="active-link">
							About
						</NavLink>
					</li>
				</ul>
			</nav>
			{children}
		</div>
	);
};
