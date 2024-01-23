import { ReactElement } from "react";
import { PageContext } from "../runtime/page-types";

/** Client-side customization hooks */
export interface ClientHooks {
	/** Called before the client starts */
	beforeStart?(): void | Promise<void>;
	/**
	 * This is called before the page is rendered. It's used for adding custom
	 * data to the page context.
	 */
	extendPageContext?(ctx: PageContext): void;
	/**
	 * This hook is intended for wrapping the React app with provider
	 * components on the client only.
	 */
	wrapApp?(app: ReactElement): ReactElement;
}

export function defineClientHooks(hooks: ClientHooks): ClientHooks {
	return hooks;
}
