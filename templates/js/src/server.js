// Server-side customization hooks (see: https://rakkasjs.org/guide/customization-hooks#server-side)
// You may delete this file if you don't need to customize anything

// Customize the way Rakkas renders and serves a page
export const servePage = async (request, renderPage) => {
	// You can manipulate the request object here before passing it to renderPage
	const response = await renderPage(
		request,
		{
			// Initialize your root context here
		},
		// Customize rendering behavior
		{
			// createLoadHelpers: (fetch) => ({
			// 	// Initialize your load helpers here (see: https://rakkasjs.org/guide/load-helpers)
			// }),
			//
			// wrap: (page) => (
			// 	// You can wrap the server-side app in a provider here.
			// 	// Useful for integrating with, e.g., Redux, styled-components, Apolle client etc.
			// 	<SomeProvider>{page}</SomeProvider>
			// ),
			//
			// You can use a custom renderer instead of React DOM's renderToString.
			// Useful for integrating with e.g. Apollo client (renderToStringWithData)
			// renderToString: (app) => someCustomRenderer(app),
			//
			// You can add extra head HTML here.
			// Useful for integrating with, e.g., Redux, styled-components, Apolle client etc.
			// getHeadHtml() {
			// 	return `<title>My App</title>`;
			// },
		},
	);

	// You can modify the response object here before returning
	// e.g. by adding a Cache-Control header
	return response;
};
