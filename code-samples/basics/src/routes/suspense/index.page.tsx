import { Head, useQuery } from "rakkasjs";
import { Suspense } from "react";

export default function SuspensePage() {
	return (
		<>
			<Head title="Suspense" />
			<Suspense fallback="Loading...">
				<SlowComponent />
			</Suspense>
		</>
	);
}

function SlowComponent() {
	const { data: message } = useQuery("slow-data", async () => {
		// Wait a few seconds to simulate a slow server response
		await new Promise((resolve) => setTimeout(resolve, 3000));
		return "Hello from slow server!";
	});

	return <h1>{message}</h1>;
}
