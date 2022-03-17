import { ReactElement } from "react";
import { RequestContext } from "../lib";

export interface RakkasServerHooks {
	wrapApp?(app: ReactElement): ReactElement;
	emitToDocumentHead?(): string;
	emitBeforeSsrChunk?(): string;
}

export type CreateServerHooksFn = (
	request: Request,
	ctx: RequestContext<Record<string, string>>,
) => RakkasServerHooks;

export interface ServerHooksModule {
	default: CreateServerHooksFn;
}
