import { createRequestHandler } from "rakkasjs";
import { createEmotionCache, MantineProvider } from "@mantine/core";
import { createStylesServer } from "@mantine/ssr";
import { injectStyles } from "./lib/inject-mantine-styles";

export default createRequestHandler({
	createPageHooks() {
		const cache = createEmotionCache({ key: "mantine" });
		const server = createStylesServer(cache);

		return {
			wrapApp(app) {
				return <MantineProvider emotionCache={cache}>{app}</MantineProvider>;
			},
			wrapSsrStream: (stream) => injectStyles(stream, cache, server),
		};
	},
});
