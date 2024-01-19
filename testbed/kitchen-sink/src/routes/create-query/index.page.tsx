import { Page, createQuery, runServerSideQuery, useQuery } from "rakkasjs";

const CreateQueryPage: Page = () => {
	const { data: double2 } = useQuery(doubler(2));
	const { data: double5 } = useQuery(doubler(5));

	return (
		<div>
			<p>2 * 2 = {double2}</p>
			<p>2 * 5 = {double5}</p>
		</div>
	);
};

export default CreateQueryPage;

CreateQueryPage.preload = (ctx) => {
	const { prefetchQuery } = ctx.queryClient;
	prefetchQuery(doubler(2));
	prefetchQuery(doubler(5));
};

const doubler = createQuery({
	createKey: (a: number) => `doubler:${a}`,
	queryFn(ctx, a) {
		return runServerSideQuery(ctx.requestContext, () => {
			return a * 2;
		});
	},
	staleTime: 1000,
});
