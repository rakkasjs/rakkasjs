import { useQuery } from "rakkasjs";
import { useRef } from "react";

export default function UseQueryPage() {
	return (
		<div>
			<h1>useQuery</h1>
			<div id="content">
				<UseQueryDisplay />
			</div>
		</div>
	);
}

function UseQueryDisplay() {
	const resolverRef = useRef<() => void>();

	const result = useQuery(
		"use-query",
		async () => {
			if (import.meta.env.SSR) {
				await new Promise<void>((resolve) => setTimeout(resolve, 1000));
				return "SSR value";
			} else {
				await new Promise<void>((resolve) => {
					resolverRef.current = resolve;
				});

				return "Client value";
			}
		},
		{ refetchOnWindowFocus: true },
	);

	return (
		<div>
			<p>
				{result.data}
				{result.isRefetching && " (refetching)"}
			</p>
			{result.isRefetching ? (
				<button onClick={() => resolverRef.current!()}>Resolve</button>
			) : (
				<button onClick={() => result.refetch()}>Refetch</button>
			)}
		</div>
	);
}
