import { createRequestHandler } from "rakkasjs/server";
import { ServerStyleSheet } from "styled-components";

export default createRequestHandler({
	createPageHooks(ctx) {
		const sheet = new ServerStyleSheet();

		return {
			wrapApp(app) {
				return sheet.collectStyles(app);
			},

			emitToDocumentHead() {
				const tags = sheet.getStyleTags();
				sheet.seal();
				return tags;
			},
		};
	},
});
