import * as commonHooksModule from "rakkasjs:common-hooks";
import pluginFactories, {
	options as configOptions,
} from "rakkasjs:plugin-common-hooks";
import type { CommonHooks } from "./common-hooks";

export const commonHooks: CommonHooks[] = [
	...pluginFactories.map((factory, i) => {
		const { commonPluginOptions = {} } = commonHooksModule;
		return factory(commonPluginOptions, configOptions[i]);
	}),
	commonHooksModule.default,
];
