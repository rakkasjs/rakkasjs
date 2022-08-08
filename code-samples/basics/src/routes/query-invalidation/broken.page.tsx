import {
	ActionContext,
	ActionResult,
	PageProps,
	useServerSideQuery,
	useSubmit,
} from "rakkasjs";
import { getUserName, setUserName } from "./db";

export default function FormsPage({ actionData }: PageProps) {
	const { data: userName } = useServerSideQuery(() => getUserName());

	const { submitHandler } = useSubmit();

	return (
		<form method="POST" onSubmit={submitHandler}>
			<h1>
				Hello <b>{userName}</b>
			</h1>
			<p>
				<label>
					User name:
					<br />
					<input type="text" name="userName" defaultValue={userName} />
				</label>
			</p>

			{actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}

			<p>
				<button type="submit">Change user name</button>
			</p>

			{actionData?.success && (
				<p style={{ color: "green" }}>User name changed.</p>
			)}
		</form>
	);
}

export async function action(ctx: ActionContext): Promise<ActionResult> {
	const formData = await ctx.requestContext.request.formData();

	const userName = formData.get("userName");

	if (!userName) {
		return {
			data: {
				error: "User name is required",
			},
		};
	}

	setUserName(String(userName));

	return {
		data: { success: true },
	};
}
