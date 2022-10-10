import {
	ActionHandler,
	Head,
	Link,
	PageProps,
	useQueryClient,
	useSubmit,
} from "rakkasjs";
import { users } from "src/data/users";

export default function SignInPage({ actionData }: PageProps) {
	const queryClient = useQueryClient();
	const { submitHandler } = useSubmit({
		onSuccess: () => {
			queryClient.invalidateQueries("session");
		},
	});

	return (
		<form onSubmit={submitHandler} method="post">
			<Head title="Sign in" />

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

			{actionData?.error && (
				<p style={{ color: "crimson" }}>{actionData.error}</p>
			)}

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
			},
		};
	}

	console.log(userName, password, users);
	const existing = users.find((user) => user.userName === userName);

	if (!existing || existing.password !== password) {
		return {
			status: 422, // Unprocessable Entity
			data: {
				error: "User name or password is incorrect.",
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
