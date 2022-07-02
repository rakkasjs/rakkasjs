import { ReactElement } from "react";
import { PageContext } from "../lib";

export interface ClientHooks {
	beforeStart?(): void | Promise<void>;
	wrapApp?(app: ReactElement): ReactElement;
	extendPageContext?(ctx: PageContext): void;
}

export function defineClientHooks(hooks: ClientHooks): ClientHooks {
	return hooks;
}
