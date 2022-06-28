import "@hattip/compose";

declare module "@hattip/compose" {
	interface RequestContext {
		url: URL;
		method: string;
		params: Record<string, string>;
		fetch: typeof fetch;
		locals: import(".").Locals;
		hooks: import(".").ServerHooks[];
	}
}
