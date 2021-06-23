import React from "react";
import { Helmet } from "react-helmet-async";

// This is component props type definition
import { Page } from "rakkasjs";

const UserProfilePage: Page = ({ params }) => (
	<div>
		<Helmet title={`Params Example - Rakkas`} />
		<p>
			Hello <b>{params.userName}</b>!
		</p>
		<nav>
			<ul>
				<li>
					<a href="/examples/params/Fatih">Fatih&apos;s profile</a>
				</li>
				<li>
					<a href="/examples/params/Dan">Dan&apos;s profile</a>
				</li>
				<li>
					<a href="/examples/params/Engin">Engin&apos;s profile</a>
				</li>
			</ul>
		</nav>
	</div>
);

export default UserProfilePage;
