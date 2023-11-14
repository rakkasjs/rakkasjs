import { useQuery, runServerSideQuery } from "rakkasjs";

export default function UseSsq() {
	const a = 2;
	const b = 5;

	const fetched1 = useQuery("run-ssq", (ctx) => {
		return runServerSideQuery(
			ctx.requestContext,
			() => ({
				result: a + b,
				ssr: import.meta.env.SSR,
			}),
			{ uniqueId: "customId" },
		);
	});

	const fetched2 = useQuery("run-ssq", (ctx) => {
		return runServerSideQuery(
			ctx.requestContext,
			() => ({
				result: a + b,
				ssr: import.meta.env.SSR,
			}),
			{ uniqueId: "customId2" },
		);
	});

	return (
		<>
			<p>
				Result 1: {fetched1.data.result}, SSR: {String(fetched1.data.ssr)}
			</p>
			<p>
				Result 2: {fetched2.data.result}, SSR: {String(fetched2.data.ssr)}
			</p>
		</>
	);
}
