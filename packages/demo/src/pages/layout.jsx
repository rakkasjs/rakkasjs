import React from "react";
import { Link, NavLink, useRouter } from "@rakkasjs/core";
import { Logomark } from "../lib/logomark";
import { Logotype } from "../lib/logotype";

export default ({ children }) => {
	const { current } = useRouter();

	const currentStyle = {
		background: "#333",
		color: "#eee",
	};

	return (
		<div>
			<div
				style={{
					color: "#924",
					padding: "1em",
				}}
			>
				<Logomark height={"4em"} />
				<Logotype height={"4em"} />
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
						<Link
							href="/faq"
							style={
								current.pathname === "/faq" ||
								current.pathname.startsWith("/faq/")
									? currentStyle
									: undefined
							}
						>
							FAQ
						</Link>
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
