import { createRequestHandler } from "rakkasjs/server";
import { ColorSchemeScript } from "@mantine/core";

export default createRequestHandler({
	createPageHooks() {
		return {
			emitToDocumentHead: () => <ColorSchemeScript />,
		};
	},
});
