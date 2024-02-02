import * as commonHooksModule from "rakkasjs:common-hooks";
import pluginFactories from "rakkasjs:plugin-common-hooks";
import { CommonHooks } from "./common-hooks";

export const commonHooks: CommonHooks[] = [
	...pluginFactories.map((factory) =>
		factory(commonHooksModule.commonPluginOptions ?? {}),
	),
	commonHooksModule.default,
];
