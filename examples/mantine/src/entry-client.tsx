import { MantineProvider } from "@mantine/core";
import { startClient } from "rakkasjs";

startClient({
	hooks: {
		wrapApp(app) {
			return (
				<MantineProvider withNormalizeCSS withGlobalStyles>
					{app}
				</MantineProvider>
			);
		},
	},
});
