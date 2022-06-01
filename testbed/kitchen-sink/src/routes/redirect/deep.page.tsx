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
	useQuery("redirect/deep", async () => {
		// Do nothing
	});

	return <Redirect href="/redirect/target" />;
}
