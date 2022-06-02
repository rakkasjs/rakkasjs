import { useQuery } from "rakkasjs";
import { Suspense } from "react";

export default function UseQueryPage() {
	return (
		<div>
			<h1>useQuery refetchInterval</h1>
			<div id="content">
				<Suspense fallback={<p>Loading...</p>}>
					<UseQueryDisplay />
				</Suspense>
			</div>
		</div>
	);
}

let counter = 1;

function UseQueryDisplay() {
	const result = useQuery(
		"use-query",
		() => {
			if (import.meta.env.SSR) {
				return 0;
			} else {
				return counter++;
			}
		},
		{
			refetchInterval: 100,
		},
	);

	return (
		<div>
			<p>Counter: {result.value}</p>
		</div>
	);
}
