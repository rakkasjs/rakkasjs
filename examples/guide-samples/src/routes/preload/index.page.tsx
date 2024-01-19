import { Page, createQuery, useQuery } from "rakkasjs";

const PreloadPage: Page = () => {
	const preloaded = useQuery(fakeDataQuery());

	return (
		<div>
			<h1>Preload example</h1>

			<p>Preloaded data: {preloaded.data}</p>
		</div>
	);
};

export default PreloadPage;

PreloadPage.preload = (ctx) => {
	// Prefetch a query to avoid waterfalls caused by late discovery of data
	// dependencies.
	ctx.queryClient.prefetchQuery(fakeDataQuery());

	return {
		// Set head meta tags. Unlike a Head component rendered in a page,
		// it is guaranteed to be rendered on the server when rendered in the
		// preload function.
		head: { title: "Preload example" },
	};
};

const fakeDataQuery = createQuery({
	createKey: () => "preload",
	queryFn() {
		return "some fake data";
	},
	refetchInterval: 1000,
});
