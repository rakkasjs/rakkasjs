import { createRequestHandler } from "rakkasjs";
import { ColorSchemeScript } from "@mantine/core";

export default createRequestHandler({
	createPageHooks() {
		return {
			emitToDocumentHead: () => <ColorSchemeScript />,
		};
	},
});
