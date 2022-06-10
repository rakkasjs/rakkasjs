import React from "react";
import { HelmetProvider } from "react-helmet-async";
import { defineClientHooks } from "../../runtime/client-hooks";

export default defineClientHooks({
	onRender(app) {
		return <HelmetProvider>{app}</HelmetProvider>;
	},
});
