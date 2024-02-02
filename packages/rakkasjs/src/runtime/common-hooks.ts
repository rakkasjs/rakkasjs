import { ReactElement } from "react";
import {
	LookupHookContext,
	LookupHookResult,
	PageContext,
} from "../runtime/page-types";
import { HookDefinition } from "./utils";

/** Page hooks common to the server and client */
export interface CommonHooks {
	/** Called before the page is rendered. It can be used to add custom
	 * properties to the page context. This is always called *after* the
	 * server-side or client-side `extendPageContext` hooks.
	 */
	extendPageContext?: HookDefinition<(ctx: PageContext) => void>;

	/**
	 * Called before attempting to match the URL to a page. It's used for
	 * rewriting or redirecting the URL.
	 */
	beforePageLookup?: HookDefinition<
		(ctx: LookupHookContext) => LookupHookResult
	>;

	/**
	 * This hook is intended for wrapping the React app with provider
	 * components. This is always called *after* the server-side or client-side
	 * `wrapApp` hooks.
	 */
	wrapApp?: HookDefinition<(app: ReactElement) => ReactElement>;
}

export interface CommonPluginOptions {}

export type CommonPluginFactory = (options: CommonPluginOptions) => CommonHooks;
