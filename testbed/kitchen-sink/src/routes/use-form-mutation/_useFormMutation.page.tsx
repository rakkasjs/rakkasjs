import { useFormMutation } from "rakkasjs";

export default function UseFormMutationPage() {
	const x = 42;
	const y = 13;

	const { action } = useFormMutation(async (ctx) => {
		const fd = await ctx.request.formData();
		console.log(fd.get("hello"));

		return x * y;
	});

	return (
		<>
			<h1>UseFormMutationPage</h1>
			<form action={action} method="post">
				<button type="submit" name="hello" value="world">
					Submit
				</button>
			</form>
		</>
	);
}
