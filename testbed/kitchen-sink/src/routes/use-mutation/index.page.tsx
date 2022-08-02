import { useMutation, PageProps } from "rakkasjs";

export default function UseMutationPage({ url }: PageProps) {
	const m = useMutation(async () => {
		await new Promise((resolve) => setTimeout(resolve, 1000));

		if (url.searchParams.has("error")) {
			throw new Error("Error");
		}

		return "Done";
	});

	return (
		<p>
			{m.isIdle ? (
				<button onClick={() => m.mutate()}>Mutate</button>
			) : m.isSuccess ? (
				<>
					{m.data} <button onClick={m.reset}>Reset</button>
				</>
			) : m.isError ? (
				<>
					{(m.error as any).message} <button onClick={m.reset}>Reset</button>
				</>
			) : m.isLoading ? (
				<>
					Loading <button onClick={m.reset}>Reset</button>
				</>
			) : null}
		</p>
	);
}
