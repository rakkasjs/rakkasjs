import React from "react";
import { hydrate } from "react-dom";

import { Router } from "@rakkasjs/core";

import { findAndRenderRoute } from "@rakkasjs:routes.tsx";

export async function startClient() {
	const initial = await findAndRenderRoute({
		url: new URL(window.location.href),
		abortSignal: new AbortController().signal,
	});

	hydrate(
		<Router render={findAndRenderRoute} skipInitialRender>
			{initial}
		</Router>,
		document.getElementById("rakkas-app"),
	);
}

startClient();
