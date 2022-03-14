import { Suspense } from "react";
import { useQuery } from "rakkasjs";

export default function SuspensePage() {
	return (
		<>
			<h1>Suspense</h1>
			<Suspense fallback={<p>Loading...</p>}>
				<LazyComponent />
			</Suspense>
		</>
	);
}

function LazyComponent() {
	const result = useQuery(
		"xxx",
		() =>
			new Promise<string>((resolve) => {
				setTimeout(() => resolve("Hello world!"), 500);
			}),
	);

	return (
		<>
			<p>I've been lazily loaded with value "{result.value}"</p>
		</>
	);
}
