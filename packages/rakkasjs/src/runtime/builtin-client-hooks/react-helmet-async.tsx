import React, { ReactElement } from "react";
import { HelmetProvider } from "react-helmet-async";

export function wrapApp(app: ReactElement): ReactElement {
	return <HelmetProvider>{app}</HelmetProvider>;
}
