import { Redirect, useQuery } from "rakkasjs";
import { Suspense } from "react";

export default function DeepRedirect() {
	return (
		<Suspense fallback="Loading...">
			<Inner />
		</Suspense>
	);
}

function Inner() {
	useQuery("...", async () => {
		await new Promise((resolve) => setTimeout(resolve, 500));
	});

	return <Redirect href="/redirect/target" />;
}
