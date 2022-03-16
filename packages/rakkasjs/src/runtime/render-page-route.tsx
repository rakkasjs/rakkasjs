/// <reference types="vite/client" />

import { RequestContext } from "../lib";
import { LayoutModule } from "./page-types";
import React, { ReactElement, ReactNode, StrictMode } from "react";
// @ts-expect-error: React 18 types aren't ready yet
import { renderToReadableStream } from "react-dom/server.browser";
import clientManifest from "virtual:rakkasjs:client-manifest";
import { CreateServerHooksFn } from "./server-hooks";

// Builtin hooks
import createReactHelmentServerHooks from "./builtin-server-hooks/react-helmet-async";
import createUseQueryServerHooks from "./builtin-server-hooks/use-query";
import { findRoute } from "./find-route";

const hookFns: CreateServerHooksFn[] = [
	createUseQueryServerHooks,
	createReactHelmentServerHooks,
];

export async function renderPageRoute(
	req: Request,
	ctx: RequestContext<Record<string, string>>,
): Promise<Response | undefined> {
	ctx.locals = {};

	const hooksObjects = hookFns.map((fn) => fn(req, ctx));

	const pageRoutes = await import("virtual:rakkasjs:server-page-routes");
	const found = findRoute(pageRoutes.default, ctx.url.pathname);
	if (!found) return;

	ctx.params = found.params;
	const importers = found.route[1];

	const promises = importers.map((importer) =>
		importer(),
	) as Promise<LayoutModule>[];

	const modules = await Promise.all(promises);

	const components = modules.map(
		(m) => m.default || (({ children }: any) => children),
	);

	let app: ReactNode = components.reduce(
		(prev, Component) => (
			<Component children={prev} url={ctx.url} params={ctx.params} />
		),
		null as any as ReactElement,
	);

	const moduleIds = found.route[2].map((m) => m[0]);

	let cssOutput = "";

	if (import.meta.env.PROD) {
		const moduleSet = new Set(moduleIds);
		const cssSet = new Set<string>();

		for (const moduleId of moduleSet) {
			const manifestEntry = clientManifest?.[moduleId];
			if (!manifestEntry) continue;

			// TODO: Prefetch modules and other assets

			manifestEntry.imports?.forEach((id) => moduleSet.add(id));
			manifestEntry.dynamicImports?.forEach((id) => moduleSet.add(id));
			manifestEntry.css?.forEach((id) => cssSet.add(id));
		}

		for (const cssFile of cssSet) {
			cssOutput += `<link rel="stylesheet" href=${escapedJson("/" + cssFile)}>`;
		}
	}

	let scriptPath = "virtual:rakkasjs:client-entry";
	if (import.meta.env.PROD) {
		scriptPath = clientManifest![scriptPath]?.file ?? scriptPath;
	}

	for (const hooks of hooksObjects) {
		if (hooks.wrapApp) {
			app = hooks.wrapApp(app);
		}
	}

	const reactStream: ReadableStream & { allReady: Promise<void> } =
		await renderToReadableStream(<StrictMode>{app}</StrictMode>, {
			bootstrapModules: ["/" + scriptPath],
		});

	// https://github.com/mahovich/isbot-fast
	// await reactStream.allReady;

	let head =
		`<!DOCTYPE html><html><head>` +
		cssOutput +
		`<meta charset="UTF-8" />` +
		`<meta name="viewport" content="width=device-width, initial-scale=1.0" />` +
		`<meta http-equiv="X-UA-Compatible" content="ie=edge" />`;

	for (const hooks of hooksObjects) {
		if (hooks.emitToDocumentHead) {
			head += hooks.emitToDocumentHead();
		}
	}

	if (import.meta.env.DEV) {
		head +=
			`<script type="module" src="/@vite/client"></script>` +
			`<script type="module" async>${REACT_FAST_REFRESH_PREAMBLE}</script>`;
	}

	head += `</head><body><div id="root">`;

	const textEncoder = new TextEncoder();

	const wrapperStream = new ReadableStream({
		start(controller) {
			controller.enqueue(textEncoder.encode(head));
		},

		async pull(controller) {
			for await (const chunk of reactStream as any as AsyncIterable<Uint8Array>) {
				for (const hooks of hooksObjects) {
					if (hooks.emitBeforeSsrChunk) {
						const text = hooks.emitBeforeSsrChunk();
						if (text) {
							controller.enqueue(textEncoder.encode(text));
						}
					}
				}

				controller.enqueue(chunk);
			}

			controller.enqueue(textEncoder.encode("</div></body></html>"));
			controller.close();
		},
	});

	return new Response(wrapperStream, {
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
}

// Generate escaped JSON to be put in a script tag
function escapedJson(json: any): string {
	return JSON.stringify(json).replace(/</g, "\\u003c");
}

const REACT_FAST_REFRESH_PREAMBLE = `import RefreshRuntime from '/@react-refresh'
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true`;
