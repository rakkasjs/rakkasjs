import { useQuery, ErrorBoundary } from "rakkasjs";
import { Suspense, useRef } from "react";

export default function UseQueryPage() {
	const resolverRef = useRef<() => void>();

	return (
		<div>
			<h1>useQuery error handling</h1>
			<div id="content">
				<ErrorBoundary
					fallbackRender={(props) => {
						return (
							<div>
								<p>Error!</p>
								<p>
									<button onClick={() => props.resetErrorBoundary()}>
										Retry
									</button>
								</p>
							</div>
						);
					}}
				>
					<Suspense
						fallback={
							<p>
								Loading...{" "}
								<button
									onClick={() => {
										resolverRef.current!();
									}}
								>
									Resolve
								</button>
							</p>
						}
					>
						<ThrowingQuery
							onSetResolver={(resolver) => (resolverRef.current = resolver)}
						/>
					</Suspense>
				</ErrorBoundary>
			</div>
		</div>
	);
}

let attempt = 0;

function ThrowingQuery(props: { onSetResolver(resolver: () => void): void }) {
	const result = useQuery("eee", async () => {
		attempt++;

		if (import.meta.env.SSR || attempt < 2) {
			throw new Error("Force client render");
		}

		await new Promise<void>((resolve) => {
			props.onSetResolver(resolve);
		});

		return "Hello world";
	});

	return <p>{result.data}</p>;
}
