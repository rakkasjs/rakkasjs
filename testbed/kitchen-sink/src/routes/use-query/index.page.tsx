import { useQuery } from "rakkasjs";
import { Suspense } from "react";

export default function UseQueryPage() {
	return (
		<div>
			<h1>Here we go!</h1>
			<SuspendedDisplay id="1" />
		</div>
	);
}

function SuspendedDisplay({ id }: { id: string }) {
	return (
		<Suspense fallback={<p>Loading...</p>}>
			<TimeDisplay id={id} />
		</Suspense>
	);
}

function TimeDisplay(props: { id: string }) {
	const result = useQuery("time", async () => {
		// Wait a second
		await new Promise((resolve) => setTimeout(resolve, 5000));
		return new Date().toISOString();
	});

	return (
		<div>
			<span style={{ color: "red" }}>{props.id}</span>
			<p>
				{result.value}
				{result.refetching && " (refetching)"}
			</p>
			<button onClick={() => result.refetch()}>Refetch</button>
		</div>
	);
}
