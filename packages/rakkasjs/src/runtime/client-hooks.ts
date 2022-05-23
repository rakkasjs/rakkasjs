import { ReactElement } from "react";

export interface ClientHooksModule {
	beforeInitialize?(): void | Promise<void>;
	wrapApp?(app: ReactElement): ReactElement;
}
