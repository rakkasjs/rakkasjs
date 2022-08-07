import React from "react";
import type { ServerHooks } from "../../runtime/hattip-handler";
import { HelmetProvider, FilledContext } from "react-helmet-async";

const headServerHooks: ServerHooks = {
	createPageHooks() {
		const helmetContext = {};

		return {
			wrapApp: (app) => {
				return <HelmetProvider context={helmetContext}>{app}</HelmetProvider>;
			},

			emitToDocumentHead() {
				const { helmet } = helmetContext as FilledContext;

				return (
					helmet.title.toString() +
					helmet.priority.toString() +
					helmet.meta.toString() +
					helmet.base.toString() +
					helmet.link.toString() +
					helmet.style.toString() +
					helmet.script.toString() +
					helmet.noscript.toString()
				);
			},
		};
	},
};

export default headServerHooks;
