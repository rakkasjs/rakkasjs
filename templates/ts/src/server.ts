// Server-side customization hooks
// You may delete this file if you don't need to customize anything

import { ServePageHook } from "rakkasjs";

// This hook allows you to intercept page requests and their responses
// It is useful, in particular, for initializing the root context with session data
export const servePage: ServePageHook = (request, renderPage) => {
	const rootContext = { session: "Nothing yet" };
	return renderPage(request, rootContext);
};
