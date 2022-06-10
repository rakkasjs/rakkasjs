import React, { ReactElement } from "react";
import { initialize, LocationContext } from "./implementation";

export function onBeforeStart() {
	initialize();
}

export function onRender(app: ReactElement): ReactElement {
	return (
		// eslint-disable-next-line ssr-friendly/no-dom-globals-in-react-fc
		<LocationContext.Provider value={location.href}>
			{app}
		</LocationContext.Provider>
	);
}
