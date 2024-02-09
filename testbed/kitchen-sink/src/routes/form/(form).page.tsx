import { ActionHandler, PageProps, useSubmit } from "rakkasjs";

export default function FormPage({ url, actionData }: PageProps) {
	const submit = useSubmit();

	if (url.searchParams.has("done")) {
		return <p>Thank you for your feedback!</p>;
	}

	return (
		<div>
			<h1>Form</h1>
			<form method="post" onSubmit={submit.submitHandler}>
				<p>
					<input name="name" type="text" />
				</p>
				{actionData && <p>{actionData}</p>}
				<p>
					<button type="submit">Submit</button>
				</p>
				{submit.status === "loading" && <p>Submitting...</p>}
			</form>
		</div>
	);
}

export const action: ActionHandler = async (ctx) => {
	const fd = await ctx.requestContext.request.formData();

	if (fd.get("name") !== "correct") {
		return { data: "Incorrect name" };
	}

	return { redirect: "/form?done" };
};
