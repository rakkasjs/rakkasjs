import { Head, Page, useQuery } from "rakkasjs";

const PreloadPage: Page = () => {
	const preloaded = useQuery("preload", () => {
		// This will only run when refetching since it will be preloaded in the
		// cache on first render.
		return getFakeData();
	});

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
	if (!ctx.queryClient.getQueryData("preload")) {
		ctx.queryClient.prefetchQuery("preload", getFakeData());
	}

	return {
		// Set head tags. Unlike a Head component rendered in a page,
		// it is guaranteed to be rendered on the server when rendered in the
		// preload function.
		head: <Head title="Preload example" />,
	};
};

async function getFakeData() {
	return "some fake data";
}
