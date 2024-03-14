import * as commonHooksModule from "rakkasjs:common-hooks";
import pluginFactories from "rakkasjs:plugin-common-hooks";
import type { CommonHooks } from "./common-hooks";

export const commonHooks: CommonHooks[] = [
	...pluginFactories.map((factory) => {
		const { commonPluginOptions = {} } = commonHooksModule;
		return factory(commonPluginOptions);
	}),
	commonHooksModule.default,
];
