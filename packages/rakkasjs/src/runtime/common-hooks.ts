import { ReactElement } from "react";
import { PageContext } from "../lib";

export interface CommonHooks {
	extendPageContext?(ctx: PageContext): void;
	beforeRoute?(ctx: PageContext, url: URL): BeforeRouteResult;
	wrapApp?(app: ReactElement): ReactElement;
}

export function defineCommonHooks(hooks: CommonHooks): CommonHooks {
	return hooks;
}

export type BeforeRouteResult =
	| void
	| { redirect: string | URL; status?: number; permanent?: boolean }
	| { rewrite: string | URL };
