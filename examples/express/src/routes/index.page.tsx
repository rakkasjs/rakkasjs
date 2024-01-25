import { PageProps, useQuery } from "rakkasjs";

export default function ExpressHomePage(props: PageProps) {
	const { data } = useQuery("data", () => {
		// We can't use ctx.fetch for Express routes
		// because Rakkas isn't aware of them
		const url = new URL("/express", props.url);
		return fetch(url).then((res) => res.json());
	});

	return <h1>{data.message}</h1>;
}
