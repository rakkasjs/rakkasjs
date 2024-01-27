import React from "react";
import { defineClientHooks } from "../../runtime/client-hooks";
import { initialize, LocationContext } from "./implementation";

export default defineClientHooks({
	beforeStart() {
		initialize();
	},

	wrapApp(app) {
		return (
			<LocationContext.Provider value={location.href}>
				{app}
			</LocationContext.Provider>
		);
	},
});
