import { Context } from "@hattip/core";

export interface RequestContext<P extends Record<string, string> = never>
	extends Context {
	url: URL;
	params: P;
	fetch: typeof fetch;
	locals: Locals;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Locals {}
