import React, { ReactNode } from "react";
import { HelmetProvider } from "react-helmet-async";

export function wrapApp(app: ReactNode): ReactNode {
	return <HelmetProvider>{app}</HelmetProvider>;
}
