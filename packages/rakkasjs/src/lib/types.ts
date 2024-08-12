/* eslint-disable @typescript-eslint/no-empty-interface */
export type {
	RequestContext,
	Locals as ServerSideLocals,
} from "@hattip/compose";
import type { navigate } from "../features/client-side-navigation/implementation/history";
import type { HeadProps } from "../features/head/implementation/types";

/** An object for storing stuff local to your app */
export interface PageLocals {}

/** A browser global for holding Rakkas specific stuff */
export interface RakkasBrowserGlobal {
	cache?: Record<string, any>;
	actionErrorIndex?: number;
	actionData?: any;
	clientRender?: boolean;
	update?: () => void;
	navigate?: typeof navigate;
	headTagStack: (HeadProps & { order: number })[];
	headOrder: number;
	setNextId?: (id: string) => void;
	emitNavigationEvent?: (url: URL) => void;
}

declare global {
	/** A browser global for holding Rakkas specific stuff */
	const rakkas: RakkasBrowserGlobal;
}
