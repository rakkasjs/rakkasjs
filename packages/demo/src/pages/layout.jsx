import React from "react";
import { NavLink, useRouter } from "@rakkasjs/core";
import { Logomark } from "../lib/logomark";
import { Logotype } from "../lib/logotype";

export default ({ children }) => {
	const { current } = useRouter();
	console.log("Path:", current.pathname);

	const currentStyle = {
		background: "#333",
		color: "#eee",
	};

	return (
		<div>
			<div style={{ color: "#626", padding: "1em" }}>
				<Logomark width={96} />
				<Logotype height={96} />
			</div>
			<p>
				This header is defined in the main layout. It's rendered in all pages.
			</p>
			<nav>
				<ul>
					<li>
						<NavLink href="/" currentRouteStyle={currentStyle}>
							Home
						</NavLink>
					</li>
					<li>
						<NavLink href="/blog" currentRouteStyle={currentStyle}>
							Blog
						</NavLink>
					</li>
					<li>
						<NavLink href="/about" currentRouteStyle={currentStyle}>
							About
						</NavLink>
					</li>
				</ul>
			</nav>
			<hr />
			{children}
		</div>
	);
};
