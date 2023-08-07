import { useQuery } from "rakkasjs";

export default function FastifyHomePage() {
	const { data } = useQuery("data", (ctx) => {
		// We can't use ctx.fetch for Fastify routes
		// because Rakkas isn't aware of them
		const url = new URL("/fastify", ctx.url);
		return fetch(url).then((res) => res.json());
	});

	return <h1>{data.message}</h1>;
}
