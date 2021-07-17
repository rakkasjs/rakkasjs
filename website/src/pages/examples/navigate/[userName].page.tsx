import React from "react";
import { Helmet } from "react-helmet-async";
import { Page, navigate } from "rakkasjs";

const UserProfilePage: Page = ({ params }) => {
	return (
		<div>
			<Helmet title={`Programmatic Navigation Example - Rakkas`} />
			<p>
				Hello <b>{params.userName}</b>!
			</p>
			<nav>
				<button onClick={() => navigate("/examples/navigate/Fatih")}>
					Fatih&apos;s profile
				</button>{" "}
				<button onClick={() => navigate("/examples/navigate/Dan")}>
					Dan&apos;s profile
				</button>{" "}
				<button onClick={() => navigate("/examples/navigate/Engin")}>
					Engin&apos;s profile
				</button>
			</nav>
		</div>
	);
};

export default UserProfilePage;
