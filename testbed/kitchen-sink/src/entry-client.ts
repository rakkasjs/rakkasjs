import { startClient } from "rakkasjs/client";

startClient({
	hooks: {
		onNavigation(url) {
			// eslint-disable-next-line no-console
			console.log("Soft-navigated to", url.href);
		},
	},
}).catch(console.error);
