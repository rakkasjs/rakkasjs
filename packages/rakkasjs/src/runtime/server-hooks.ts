import { ReactNode } from "react";
import { RequestContext } from "../lib";

export interface RakkasServerHooks {
	wrapApp?(app: ReactNode): ReactNode;
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
