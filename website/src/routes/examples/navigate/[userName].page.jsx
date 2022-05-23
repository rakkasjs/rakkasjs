import React from "react";
import { Head, navigate } from "rakkasjs";

const UserProfilePage = ({ params }) => {
	return (
		<div>
			<Head title={`Programmatic Navigation Example - Rakkas`} />
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
