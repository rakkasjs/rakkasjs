import { useQuery, runServerSideQuery } from "rakkasjs";

export default function UseSsq() {
	const a = 2;
	const b = 5;

	const fetched = useQuery("run-ssq", (ctx) => {
		return runServerSideQuery(ctx.requestContext, () => ({
			result: a + b,
			ssr: import.meta.env.SSR,
		}));
	});

	return (
		<p>
			Result: {fetched.data.result}, SSR: {String(fetched.data.ssr)}
		</p>
	);
}
