import { Suspense } from "react";
import { useQuery } from "rakkasjs";
import { Helmet } from "react-helmet-async";

export default function SuspensePage() {
	return (
		<>
			<Helmet title="Early title" />
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
			<Helmet title="Suspense" />
			<p>I've been lazily loaded with value "{result.value}"</p>
		</>
	);
}
