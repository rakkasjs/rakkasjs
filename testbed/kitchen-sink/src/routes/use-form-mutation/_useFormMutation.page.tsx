import { PageProps, useFormMutation } from "rakkasjs";

export default function UseFormMutationPage({ url }: PageProps) {
	const { action, data, submitHandler, status } = useFormMutation(
		async (ctx) => {
			const fd = await ctx.request.formData();

			if (fd.get("name") !== "correct") {
				return { data: "Incorrect name" };
			}

			return { redirect: "?done" };
		},
	);

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
				{data && <p>{data}</p>}
				<p>
					<button type="submit">Submit</button>
				</p>
				{status === "loading" && <p>Submitting...</p>}
			</form>
		</div>
	);
}
