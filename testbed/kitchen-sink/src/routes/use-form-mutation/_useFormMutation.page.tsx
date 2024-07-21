import { PageProps, useFormMutation } from "rakkasjs";

export default function UseFormMutationPage({ url }: PageProps) {
	const { action, data, submitHandler, status } = useFormMutation<{
		error?: string;
	}>(async (ctx) => {
		const fd = await ctx.request.formData();

		if (fd.get("name") !== "correct") {
			return { data: { error: "Incorrect name" } };
		}

		return { redirect: "?done", data: {} };
	});

	if (url.searchParams.has("done")) {
		return <p>Thank you for your feedback!</p>;
	}

	return (
		<div>
			<h1>Form</h1>
			<form action={action} method="post" onSubmit={submitHandler}>
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
