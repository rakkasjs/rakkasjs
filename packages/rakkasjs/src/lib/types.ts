/* eslint-disable @typescript-eslint/no-empty-interface */
export type {
	RequestContext,
	Locals as ServerSideLocals,
} from "@hattip/compose";

/** An object for storing stuff local to your app */
export interface PageLocals {}

/** An object for storing stuff local to your app */
export interface RakkasBrowserGlobal {
	/** Render as an SPA */
	spa?: boolean;
	/** Streaming cache */
	cache?: Record<string, any>;
	/** Action index */
	actionIndex?: number;
	/** Action data */
	actionData?: any;
	/** Dev only, force a rerender on HMR */
	update?(): void;
}

declare global {
	const rakkas: RakkasBrowserGlobal;
}
