import { useMutations } from "rakkasjs";

export default function UseMutationsPage() {
	const mutations = useMutations(
		async (text: string) => {
			console.log("Mutation called with", text);

			await sleep(Math.random() * 1000);

			return text.toUpperCase();
		},
		{
			onMutate(id, vars) {
				console.log("Mutation", id, "mutating with", vars);
			},
			onSuccess(id, data) {
				console.log("Mutation", id, "succeeded with", data);
			},
			onError(id, error) {
				console.log("Mutation", id, "failed with", error);
			},
		},
	);

	console.log("Mutations", mutations.pending);

	return (
		<button
			type="button"
			onClick={async () => {
				mutations.mutate("foo");
				await sleep(100);
				mutations.mutate("bar");
				await sleep(100);
				mutations.mutate("baz");
			}}
		>
			Go
		</button>
	);
}

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
