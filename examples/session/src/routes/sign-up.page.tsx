import {
	ActionHandler,
	Head,
	Link,
	PageProps,
	useQueryClient,
	useSubmit,
} from "rakkasjs";
import { useRef } from "react";
import { users } from "src/data/users";

export default function SignUpPage() {
	const queryClient = useQueryClient();

	const { submitHandler, data } = useSubmit<{ error?: string }>({
		onSuccess: (result) => {
			if (!result.error) {
				queryClient.invalidateQueries("session");
			}
		},
	});

	return (
		<form onSubmit={submitHandler} method="post">
			<Head title="Sign up" />

			<p>
				<label>
					User name:
					<br />
					<input type="text" name="userName" />
				</label>
			</p>

			<p>
				<label>
					Password:
					<br />
					<input type="password" name="password" />
				</label>
			</p>

			{data?.error && <p style={{ color: "crimson" }}>{data.error}</p>}

			<p>
				<button type="submit">Sign up</button>
			</p>

			<p>
				Have an account? <Link href="/sign-in">Sign in</Link>.
			</p>
		</form>
	);
}

export const action: ActionHandler<{ error?: string }> = async (ctx) => {
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
			},
		};
	}

	const existing = users.find((user) => user.userName === userName);
	if (existing) {
		return {
			status: 409, // Conflict
			data: {
				error: "User name already exists.",
			},
		};
	}

	users.push({
		userName,
		// Don't store passwords in plain text in real apps!
		password,
	});

	ctx.requestContext.session.data.userName = userName;

	// This doesn't do anything with stores that store session data in the
	// cookie itself, but it's necessary for other stores to regenerate the
	// session ID to prevent session fixation attacks.
	await ctx.requestContext.session.regenerate();

	return {
		redirect: "/",
		data: {},
	};
};
