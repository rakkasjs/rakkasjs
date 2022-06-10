import { ReactElement } from "react";

export interface ClientHooks {
	onBeforeStart?(): void | Promise<void>;
	onRender?(app: ReactElement): ReactElement;
}
