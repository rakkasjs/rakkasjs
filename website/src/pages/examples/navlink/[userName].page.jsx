import React from "react";
import { Helmet } from "react-helmet-async";
import { NavLink } from "rakkasjs";

const UserProfilePage = ({ params }) => (
	<div>
		<Helmet title={`NavLink Example - Rakkas`} />
		<p>
			Hello <b>{params.userName}</b>!
		</p>
		<nav>
			<ul>
				<li>
					<NavLink
						href="/examples/navlink/Fatih"
						currentRouteStyle={{ fontWeight: "bold" }}
					>
						Fatih&apos;s profile
					</NavLink>
				</li>
				<li>
					<NavLink
						href="/examples/navlink/Dan"
						currentRouteStyle={{ fontWeight: "bold" }}
					>
						Dan&apos;s profile
					</NavLink>
				</li>
				<li>
					<NavLink
						href="/examples/navlink/Engin"
						currentRouteStyle={{ fontWeight: "bold" }}
					>
						Engin&apos;s profile
					</NavLink>
				</li>
			</ul>
		</nav>
	</div>
);

export default UserProfilePage;
