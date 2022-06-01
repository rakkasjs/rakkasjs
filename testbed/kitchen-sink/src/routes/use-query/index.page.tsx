import { useQuery } from "rakkasjs";
import { Suspense, useRef } from "react";

export default function UseQueryPage() {
	return (
		<div>
			<h1>Here we go!</h1>
			<div id="content">
				<Suspense fallback={<p>Loading...</p>}>
					<UseQueryDisplay />
				</Suspense>
			</div>
		</div>
	);
}

function UseQueryDisplay() {
	const resolverRef = useRef<() => void>();

	const result = useQuery("use-query", async () => {
		if (import.meta.env.SSR) {
			return "SSR value";
		} else {
			await new Promise<void>((resolve) => {
				resolverRef.current = resolve;
			});

			return "Client value";
		}
	});

	return (
		<div>
			<p>
				{result.value}
				{result.refetching && " (refetching)"}
			</p>
			{result.refetching ? (
				<button onClick={() => resolverRef.current!()}>Resolve</button>
			) : (
				<button onClick={() => result.refetch()}>Refetch</button>
			)}
		</div>
	);
}
