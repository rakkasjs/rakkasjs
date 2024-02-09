/* eslint-disable @typescript-eslint/no-empty-interface */
export type {
	RequestContext,
	Locals as ServerSideLocals,
} from "@hattip/compose";

/** An object for storing stuff local to your app */
export interface PageLocals {}

declare global {
	/** Browser global for holding Rakkas specific data */
	const rakkas: {
		cache?: Record<string, any>;
		actionErrorIndex?: number;
		actionData?: any;
		clientRender?: boolean;
		update?: () => void;
	};
}
