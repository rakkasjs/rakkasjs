import { ReactElement } from "react";

export interface ClientHooksModule {
	beforeInitialize?(hydrate: boolean): Promise<void>;
	wrapApp?(app: ReactElement): ReactElement;
}
