import { ReactElement } from "react";
import { PageContext, LookupHookResult } from "../lib";

/** Page hooks common to the server and client */
export interface CommonHooks {
	/** Called before the page is rendered. It can be used to add custom
	 * properties to the page context. This is always called *after* the
	 * server-side or client-side `extendPageContext` hooks.
	 */
	extendPageContext?(ctx: PageContext): void;
	/**
	 * Called before attempting to match the URL to a page. It's used for
	 * rewriting or redirecting the URL.
	 */
	beforePageLookup?(ctx: PageContext, url: URL): LookupHookResult;
	/**
	 * This hook is intended for wrapping the React app with provider
	 * components. This is always called *after* the server-side or client-side
	 * `wrapApp` hooks.
	 */
	wrapApp?(app: ReactElement): ReactElement;
}
