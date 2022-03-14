import { ReactNode } from "react";

export interface ClientHooksModule {
	beforeInitialize?(hydrate: boolean): Promise<void>;
	wrapApp?(app: ReactNode): ReactNode;
}
