import { PageProps, useLocation, useQuery } from "rakkasjs";

export default function FastifyHomePage(props: PageProps) {
	const { data } = useQuery("data", () => {
		// We can't use ctx.fetch for Fastify routes
		// because Rakkas isn't aware of them
		const url = new URL("/fastify", props.url);
		return fetch(url).then((res) => res.json());
	});

	return <h1>{data.message}</h1>;
}
