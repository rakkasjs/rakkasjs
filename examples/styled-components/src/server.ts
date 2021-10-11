import { ServePageHook } from "rakkasjs";
import { ServerStyleSheet } from "styled-components";

export const servePage: ServePageHook = (request, renderPage) => {
	const sheet = new ServerStyleSheet();

	return renderPage(request, undefined, {
		wrap: (page) => sheet.collectStyles(page),
		getHeadHtml: () => sheet.getStyleTags(),
	});
};
