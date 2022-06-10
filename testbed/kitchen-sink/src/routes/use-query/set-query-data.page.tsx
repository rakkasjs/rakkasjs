import { useQuery, useQueryClient } from "rakkasjs";

export default function SetQueryDataPage() {
	const { data: letters } = useQuery("letters", async () => [
		"AAA",
		"BBB",
		"CCC",
	]);
	const client = useQueryClient();
	letters.forEach((letter, i) => client.setQueryData(`letters/${i}`, letter));

	return (
		<div>
			<h1>useQuery</h1>
			<ol>
				{letters.map((_, i) => (
					<NumberDisplay key={i} id={i} />
				))}
			</ol>
		</div>
	);
}

function NumberDisplay({ id }: { id: number }) {
	const { data: letter } = useQuery(`letters/${id}`, () => {
		throw new Error("This should not be called");
	});

	return <li>{letter}</li>;
}
