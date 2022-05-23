import React, { ReactElement } from "react";
import { initialize, LocationContext } from "./implementation";

export function beforeInitialize() {
	initialize();
}

export function wrapApp(app: ReactElement): ReactElement {
	return (
		<LocationContext.Provider value={location.href}>
			{app}
		</LocationContext.Provider>
	);
}
