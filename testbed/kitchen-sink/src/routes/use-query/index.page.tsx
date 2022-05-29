import { useQuery } from "rakkasjs";
import { Suspense } from "react";

export default function UseQueryPage() {
	return (
		<div>
			<h1>Here we go!</h1>
			<SuspendedDisplay />
			<SuspendedDisplay />
		</div>
	);
}

function SuspendedDisplay() {
	return (
		<Suspense fallback={<p>Loading...</p>}>
			<TimeDisplay />
		</Suspense>
	);
}

function TimeDisplay() {
	const result = useQuery(
		"time",
		async () => {
			// Wait a second
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return new Date().toISOString();
		},
		{
			staleTime: 10_000,
		},
	);

	return (
		<div>
			<p>
				{result.value}
				{result.refetching && " (refetching)"}
			</p>
			<button onClick={() => result.refetch()}>Refetch</button>
		</div>
	);
}
