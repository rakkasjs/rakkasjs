import { ReactElement } from "react";
import { QueryContext } from "../lib";

export interface ClientHooks {
	beforeStart?(): void | Promise<void>;
	wrapApp?(app: ReactElement): ReactElement;
	augmentQueryContext?(ctx: QueryContext): void;
}

export function defineClientHooks(hooks: ClientHooks): ClientHooks {
	return hooks;
}
