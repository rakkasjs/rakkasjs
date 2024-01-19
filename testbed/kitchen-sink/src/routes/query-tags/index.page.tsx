import { useMutation, useQuery } from "rakkasjs";

export default function QueryTagsPage() {
	const { data: data1 } = useQuery("tagged1", async () => counter1, {
		tags: ["a", "b", "c"],
	});

	const { data: data2 } = useQuery("tagged2", async () => counter2, {
		tags: ["x", "y", "z"],
	});

	const { data: data3 } = useQuery("tagged3", async () => counter3, {
		tags: ["a", "x", "y"],
	});

	const { mutate } = useMutation(
		async () => {
			// Increment all but only invalidate data1 and data3
			counter1++;
			counter2++;
			counter3++;
		},
		{
			invalidateTags: ["a"],
		},
	);

	return (
		<div>
			<p>data1: {data1}</p>
			<p>data2: {data2}</p>
			<p>data3: {data3}</p>
			<p>
				<button onClick={() => mutate()}>Mutate</button>
			</p>
		</div>
	);
}

let counter1 = 0;
let counter2 = 0;
let counter3 = 0;
