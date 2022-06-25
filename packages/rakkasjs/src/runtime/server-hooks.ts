import { ReactElement } from "react";
import type { RequestContext } from "@hattip/compose";

export interface RakkasServerHooks {
	handleRequest?(): Response | undefined | Promise<Response | undefined>;
	wrapApp?(app: ReactElement): ReactElement;
	emitToDocumentHead?(): string;
	emitBeforeSsrChunk?(): string | undefined;
}

export type CreateServerHooksFn = (ctx: RequestContext) => RakkasServerHooks;

export interface ServerHooksModule {
	default: CreateServerHooksFn;
}
