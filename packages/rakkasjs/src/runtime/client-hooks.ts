import { ReactElement } from "react";

export interface ClientHooks {
	onBeforeStart?(): void | Promise<void>;
	onRender?(app: ReactElement): ReactElement;
}

export function defineClientHooks(hooks: ClientHooks): ClientHooks {
	return hooks;
}
