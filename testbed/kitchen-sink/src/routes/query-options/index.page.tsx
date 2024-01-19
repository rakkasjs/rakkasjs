import { Page, queryOptions, runServerSideQuery, useQuery } from "rakkasjs";

const QueryOptionsPage: Page = () => {
	const { data: double2 } = useQuery(doubler(2));
	const { data: double5 } = useQuery(doubler(5));

	return (
		<div>
			<p>2 * 2 = {double2}</p>
			<p>2 * 5 = {double5}</p>
		</div>
	);
};

export default QueryOptionsPage;

QueryOptionsPage.preload = (ctx) => {
	const { prefetchQuery } = ctx.queryClient;
	prefetchQuery(doubler(2));
	prefetchQuery(doubler(5));
};

function doubler(x: number) {
	return queryOptions({
		queryKey: `doubler:${x}`,
		queryFn(ctx) {
			return runServerSideQuery(ctx.requestContext, () => {
				return x * 2;
			});
		},
		staleTime: 1000,
	});
}
