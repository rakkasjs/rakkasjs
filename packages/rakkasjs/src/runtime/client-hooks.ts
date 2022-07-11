import { ReactElement } from "react";
import { PageContext } from "../lib";
import { BeforeRouteResult } from "./common-hooks";

export interface ClientHooks {
	beforeStart?(): void | Promise<void>;
	beforeRoute?(ctx: PageContext, url: URL): BeforeRouteResult;
	extendPageContext?(ctx: PageContext): void;
	wrapApp?(app: ReactElement): ReactElement;
}

export function defineClientHooks(hooks: ClientHooks): ClientHooks {
	return hooks;
}
