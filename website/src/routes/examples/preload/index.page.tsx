import { Head, Page, useQuery } from "rakkasjs";

const PreloadPage: Page<never, { key: "value" }> = ({ meta }) => {
	const preloaded = useQuery("preload", () => {
		// This will only run when refetching since it will be preloaded in the
		// cache on first render.
		return getFakeData();
	});

	return (
		<div>
			<h1>Preload example</h1>

			<p>Preloaded data: {preloaded.data}</p>
			<p>Metadata: {meta.key}</p>
		</div>
	);
};

PreloadPage.preload = (ctx) => {
	// Preload a query to avoid waterfalls caused by late discovery of data
	// dependencies. You can also pass a promise here with or without the
	// `await`.
	if (!ctx.queryClient.getQueryData("preload")) {
		ctx.queryClient.setQueryData("preload", getFakeData());
	}

	return {
		// Set head tags. Unlike a Head component rendered in a page,
		// it is guaranteed to be rendered on the server when rendered in the
		// preload function.
		head: <Head title="Preload example" />,
		// Set response headers. Unlike the ResponseHeaders component, headers
		// and status set this way are guaranteed to take effect even when
		// streaming the response.
		headers: {
			status: 200,
			headers: {
				"Cache-Control": "public, max-age=0",
			},
		},
		// Some custom metadata passed to page and layout components
		meta: {
			// Pages and inner layouts will overwrite their parents' meta
			// if they have the same keys.
			key: "value",
		},
	};
};

function getFakeData() {
	return "some fake data";
}
