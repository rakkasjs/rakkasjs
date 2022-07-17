import { ReactElement } from "react";
import { PageContext } from "../lib";

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
	beforeRoute?(ctx: PageContext, url: URL): BeforeRouteResult;
	/**
	 * This hook is intended for wrapping the React app with provider
	 * components. This is always called *after* the server-side or client-side
	 * `wrapApp` hooks.
	 */
	wrapApp?(app: ReactElement): ReactElement;
}

/** Return type of the beforeRoute hook */
export type BeforeRouteResult =
	| void
	| {
			/** Location to redirect to */
			redirect: string | URL;
			/** Whether the redirect is permanent @default false */
			permanent?: boolean;
			/** The status code to use (hes precedence over `permanent`) */
			status?: number;
	  }
	| {
			/** Render this URL instead of the requested one */
			rewrite: string | URL;
	  };
