import React from "react";
import { CreateServerHooksFn } from "../server-hooks";
import { HelmetProvider, FilledContext } from "react-helmet-async";

const createServerHooks: CreateServerHooksFn = () => {
	const helmetContext = {};

	return {
		wrapApp: (app) => {
			return <HelmetProvider context={helmetContext}>{app}</HelmetProvider>;
		},

		emitToDocumentHead() {
			const { helmet } = helmetContext as FilledContext;

			return (
				// TODO: Prioritize SEO head tags: https://github.com/staylor/react-helmet-async#prioritizing-tags-for-seo
				helmet.title.toString() +
				helmet.meta.toString() +
				helmet.base.toString() +
				helmet.link.toString() +
				helmet.style.toString() +
				helmet.script.toString() +
				helmet.noscript.toString()
			);
		},
	};
};

export default createServerHooks;
