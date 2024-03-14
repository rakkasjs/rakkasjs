import type { ReactElement } from "react";
import type { PageContext } from "../runtime/page-types";
import type { HookDefinition } from "./utils";

/** Client-side customization hooks */
export interface ClientHooks {
	/** Called before the client starts */
	beforeStart?(): void | Promise<void>;
	/**
	 * This is called before the page is rendered. It's used for adding custom
	 * data to the page context.
	 */
	extendPageContext?: HookDefinition<(ctx: PageContext) => void>;
	/**
	 * This hook is intended for wrapping the React app with provider
	 * components on the client only.
	 */
	wrapApp?(app: ReactElement): ReactElement;
}

export function defineClientHooks(hooks: ClientHooks): ClientHooks {
	return hooks;
}
