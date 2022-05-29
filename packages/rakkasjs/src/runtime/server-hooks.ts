import { ReactElement } from "react";
import { RequestContext } from "../lib";

export interface RakkasServerHooks {
	handleRequest?(): Response | undefined | Promise<Response | undefined>;
	wrapApp?(app: ReactElement): ReactElement;
	emitToDocumentHead?(): string;
	emitBeforeSsrChunk?(): string | undefined;
}

export type CreateServerHooksFn = (
	request: Request,
	ctx: RequestContext<Record<string, string>>,
) => RakkasServerHooks;

export interface ServerHooksModule {
	default: CreateServerHooksFn;
}
