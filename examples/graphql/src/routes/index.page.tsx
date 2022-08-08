import { useQuery } from "rakkasjs";

export default function GraphqlPage() {
	const { data } = useQuery("hello", async (ctx) =>
		ctx
			.fetch("/graphql", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Test": "test",
				},
				body: JSON.stringify({ query: "{ hello }" }),
			})
			.then((res) => res.json()),
	);

	return (
		<div>
			<h1>Hello world!</h1>
			<p>Data fetched with GraphQL:</p>
			<pre>{JSON.stringify(data, null, 2)}</pre>
			{import.meta.env.DEV && (
				<a href="/graphql">GraphiQL playground (only available in dev)</a>
			)}
		</div>
	);
}
