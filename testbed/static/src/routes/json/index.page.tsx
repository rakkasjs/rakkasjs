import { useQuery } from "rakkasjs";

export default function JsonPage() {
	const { data } = useQuery("api", (ctx) =>
		ctx.fetch("/json/endpoint.json").then((r) => r.json()),
	);

	return (
		<div>
			<pre>{JSON.stringify(data, null, 2)}</pre>
		</div>
	);
}
