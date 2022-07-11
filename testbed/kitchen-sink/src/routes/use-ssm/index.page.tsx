import { useSSM } from "rakkasjs";
import { useState } from "react";

export default function UseSsmPage() {
	const a = 2;
	const b = 5;
	const [fetched, setFetched] = useState("Not fetched");

	const { mutate } = useSSM(
		(ctx, factor: number) => {
			return import.meta.env.SSR
				? `Computed on the server: ${factor * (a + b)}`
				: `Computed on the client: ${factor * (a + b)}`;
		},
		{
			onSuccess(data) {
				setFetched(data);
			},
		},
	);

	return (
		<>
			<p>{fetched}</p>
			<p>
				<button onClick={() => mutate(2)}>Fetch</button>
			</p>
		</>
	);
}
