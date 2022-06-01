import { ResponseHeaders, useQuery } from "rakkasjs";
import { Suspense } from "react";

export default function DeepHeaders() {
	return (
		<Suspense fallback="Loading...">
			<Inner />
		</Suspense>
	);
}

function Inner() {
	useQuery("response-headers", async () => {
		// Redirect
	});

	return (
		<ResponseHeaders
			status={400}
			headers={{ "X-Custom-Header": "Custom value" }}
		/>
	);
}
