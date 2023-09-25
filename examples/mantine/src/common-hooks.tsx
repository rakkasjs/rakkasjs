import { CommonHooks } from "rakkasjs";
import { MantineProvider, createTheme } from "@mantine/core";

const theme = createTheme({
	/** Put your mantine theme override here */
});

export default {
	wrapApp(app) {
		return <MantineProvider theme={theme}>{app}</MantineProvider>;
	},
} satisfies CommonHooks;
