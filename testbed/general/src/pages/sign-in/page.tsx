import React, { useEffect, useState } from "react";
import { navigate, Page, setRootContext } from "rakkasjs";

const LoginPage: Page = function HomePage() {
	const [disabled, setDisabled] = useState(true);

	useEffect(() => {
		setDisabled(false);
	}, []);

	return (
		<div>
			<form
				method="POST"
				action="/api/sign-in"
				noValidate
				onSubmit={async (e) => {
					console.log("Submitting");

					e.preventDefault();
					const fd = new FormData(e.currentTarget);
					const usp = new URLSearchParams([...fd.entries()] as Array<
						[string, string]
					>);

					fetch("/api/sign-in", {
						method: "POST",
						headers: { "Content-Type": "application/x-www-form-urlencoded" },
						body: usp,
					})
						.then((r) => {
							if (!r.ok) throw new Error("Server response is not OK");
							return r.json();
						})
						.then((j) => {
							console.log("Setting root context");
							setRootContext((old) => ({ ...old, session: j }));
							console.log("Navigating");
							navigate("/sign-in/signed-in");
						});
				}}
			>
				<p>
					<label>
						E-mail
						<br />
						<input type="email" name="email" />
					</label>
				</p>

				<p>
					<label>
						Password
						<br />
						<input type="password" name="password" />
					</label>
				</p>

				<p>
					<button disabled={disabled}>Sign in</button>
				</p>
			</form>
		</div>
	);
};

export default LoginPage;
