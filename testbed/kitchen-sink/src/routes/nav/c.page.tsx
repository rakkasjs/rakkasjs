import { useQuery } from "rakkasjs";
import { Suspense } from "react";

export default function NavCPage() {
	return (
		<>
			<p>Client-side navigation test page C</p>
			<Suspense fallback={<div>Loading...</div>}>
				<SlowComponent />
			</Suspense>
		</>
	);
}

function SlowComponent() {
	useQuery("slow-component", async () => {
		await new Promise((resolve) => setTimeout(resolve, 1000));
	});

	return <p>Slow component</p>;
}
