import {
	ActionContext,
	ActionResult,
	Head,
	PageProps,
	useSubmit,
} from "rakkasjs";

export default function FormsPage({ actionData }: PageProps) {
	const { submitHandler } = useSubmit();

	return (
		<form method="POST" onSubmit={submitHandler}>
			<Head title="Form example" />
			<h1>Form example</h1>
			<p>Hint: Creadentials are definitely not admin/admin!</p>
			<p>
				<label>
					User name:
					<br />
					<input
						type="text"
						name="userName"
						defaultValue={actionData?.userName}
					/>
				</label>
			</p>
			<p>
				<label>
					Password:
					<br />
					<input
						type="password"
						name="password"
						defaultValue={actionData?.password}
					/>
				</label>
			</p>
			<p>
				<button type="submit">Submit</button>
			</p>
			{actionData && <p style={{ color: "red" }}>{actionData.message}</p>}
		</form>
	);
}

export async function action(ctx: ActionContext): Promise<ActionResult> {
	const formData = await ctx.requestContext.request.formData();

	if (
		formData.get("userName") === "admin" &&
		formData.get("password") === "admin"
	) {
		return {
			redirect: "/use-submit/submitted",
		};
	}

	return {
		data: {
			message: "Incorrect username or password",
			// We'll echo the data back so that the form doesn't get reset
			userName: formData.get("userName"),
			password: formData.get("password"),
		},
	};
}
