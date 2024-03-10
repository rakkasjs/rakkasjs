import React from "react";
import { defineClientHooks } from "../../runtime/client-hooks";
import { initialize } from "./implementation/history";
import { LocationContext } from "./implementation/link";

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
