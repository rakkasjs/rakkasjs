import { useQuery, ErrorBoundary } from "rakkasjs";
import { Suspense } from "react";

export default function UseQueryPage() {
	return (
		<div>
			<h1>useQuery error handling</h1>
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
				<Suspense fallback={<p>Loading...</p>}>
					<ThrowingQuery />
				</Suspense>
			</ErrorBoundary>
		</div>
	);
}

let attempt = 0;

function ThrowingQuery() {
	const result = useQuery("eee", async () => {
		attempt++;

		await new Promise((resolve) => setTimeout(resolve, 1000));

		if (attempt === 1) {
			throw new Error("This is an error");
		}

		return "Hello world";
	});

	return <p>{result.value}</p>;
}
