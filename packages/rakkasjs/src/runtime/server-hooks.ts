import { ReactNode } from "react";
import { RequestContext } from "../lib";

export interface RakkasServerHooks {
	wrapApp?(app: ReactNode): ReactNode;
	emitToDocumentHead?(): string;
	emitToDocumentBodyBeforeApp?(): string;
	emitBeforeSsrChunk?(): string;
	emitToDocumentBodyAfterApp?(): string;
}

export type CreateServerHooksFn = (
	request: Request,
	ctx: RequestContext<Record<string, string>>,
) => RakkasServerHooks;

export interface ServerHooksModule {
	default: CreateServerHooksFn;
}
