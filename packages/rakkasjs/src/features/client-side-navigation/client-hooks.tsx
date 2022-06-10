import React from "react";
import { defineClientHooks } from "../../runtime/client-hooks";
import { initialize, LocationContext } from "./implementation";

export default defineClientHooks({
	onBeforeStart() {
		initialize();
	},

	onRender(app) {
		return (
			// eslint-disable-next-line ssr-friendly/no-dom-globals-in-react-fc
			<LocationContext.Provider value={location.href}>
				{app}
			</LocationContext.Provider>
		);
	},
});
