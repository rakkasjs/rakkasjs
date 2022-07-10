import { ReactElement } from "react";
import { PageContext } from "../lib";

export interface CommonHooks {
	extendPageContext?(ctx: PageContext): void;
	wrapApp?(app: ReactElement): ReactElement;
}

export function defineCommonHooks(hooks: CommonHooks): CommonHooks {
	return hooks;
}
