import {
	ActionHandler,
	Head,
	Link,
	PageProps,
	usePageContext,
	useQueryClient,
	useSubmit,
} from "rakkasjs";
import { useRef } from "react";
import { users } from "src/data/users";

export default function SignInPage() {
	const queryClient = useQueryClient();

	const passwordRef = useRef<HTMLInputElement>(null);

	const { submitHandler, data } = useSubmit({
		onSuccess(data) {
			if (data) {
				// Data means, unintuitively, there was an error
				// Let's clear the password field
				passwordRef.current!.value = "";
			} else {
				queryClient.invalidateQueries("session");
			}
		},
	});

	const { actionData: pcActionData } = usePageContext();

	return (
		<form onSubmit={submitHandler} method="post">
			<Head title="Sign in" />

			<p>
				<label>
					User name:
					<br />
					<input type="text" name="userName" defaultValue={data?.userName} />
				</label>
			</p>

			<p>
				<label>
					Password:
					<br />
					<input type="password" name="password" ref={passwordRef} />
				</label>
			</p>

			{data?.error && <p style={{ color: "crimson" }}>{data.error}</p>}

			<p>
				<button type="submit">Sign in</button>
			</p>

			<p>
				Don't have an account? <Link href="/sign-up">Sign up</Link>.
			</p>
		</form>
	);
}

export const action: ActionHandler = async (ctx) => {
	const fd = await ctx.requestContext.request.formData();
	const userName = fd.get("userName");
	const password = fd.get("password");

	if (
		!userName ||
		!password ||
		typeof userName !== "string" ||
		typeof password !== "string"
	) {
		return {
			status: 422, // Unprocessable Entity
			data: {
				error: "User name and password are required.",
				// Echo back the user name to make it easier to fix
				// when JavaScript is disabled
				userName: typeof userName === "string" ? userName : "",
			},
		};
	}

	const existing = users.find((user) => user.userName === userName);

	if (!existing || existing.password !== password) {
		return {
			status: 422, // Unprocessable Entity
			data: {
				error: "User name or password is incorrect.",
				// Echo back the user name to make it easier to fix
				// when JavaScript is disabled
				userName,
			},
		};
	}

	ctx.requestContext.session.data.userName = userName;

	// This doesn't do anything with stores that store session data in the
	// cookie itself, but it's necessary for other stores to regenerate the
	// session ID to prevent session fixation attacks.
	await ctx.requestContext.session.regenerate();

	return { redirect: "/" };
};
