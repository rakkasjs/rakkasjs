import { ActionHandler, PageProps, useSubmit } from "rakkasjs";

export default function FormPage({ url }: PageProps) {
	const { data, status, submitHandler } = useSubmit<{ error?: string }>();

	if (url.searchParams.has("done")) {
		return <p>Thank you for your feedback!</p>;
	}

	return (
		<div>
			<h1>Form</h1>
			<form method="post" onSubmit={submitHandler}>
				<p>
					<input name="name" type="text" />
				</p>
				{data?.error && <p>{data.error}</p>}
				<p>
					<button type="submit">Submit</button>
				</p>
				{status === "loading" && <p>Submitting...</p>}
			</form>
		</div>
	);
}

export const action: ActionHandler<{ error?: string }> = async (ctx) => {
	const fd = await ctx.requestContext.request.formData();

	if (fd.get("name") !== "correct") {
		return { data: { error: "Incorrect name" } };
	}

	return { redirect: "/form?done", data: {} };
};
