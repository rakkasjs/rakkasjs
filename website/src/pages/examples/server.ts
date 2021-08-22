import { ServePageHook } from "rakkasjs";

// This customization hook allows you to intercept page requests and their responses
export const servePage: ServePageHook = async (request, renderPage) => {
	// This will be passed in the context prop to your outermost layout object
	const rootContext = { hello: "world" };

	const response = await renderPage(request, rootContext);

	// You can modify the response object here if you need to
	return response;
};
