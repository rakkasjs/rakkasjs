/// <reference types="vite/client" />

import { RequestContext } from "../../lib";
import React, { StrictMode, Suspense } from "react";
import { renderToReadableStream } from "react-dom/server.browser";
import clientManifest from "virtual:rakkasjs:client-manifest";
import { App, RouteContext } from "../../runtime/App";
import isBot from "isbot-fast";
import { findRoute } from "../../internal/find-route";
import {
	ResponseContext,
	ResponseContextProps,
} from "../response-manipulation/implementation";
import serverHooks from "../../runtime/feature-server-hooks";

export default async function renderPageRoute(
	req: Request,
	ctx: RequestContext<Record<string, string>>,
): Promise<Response | undefined> {
	ctx.locals = {};

	const hooksObjects = serverHooks.map((fn) => fn(req, ctx));

	for (const hooks of hooksObjects) {
		if (hooks.handleRequest) {
			const response = await hooks.handleRequest();
			if (response) {
				return response;
			}
		}
	}

	const routes = (await import("virtual:rakkasjs:server-page-routes")).default;

	const found = findRoute(routes, ctx.url.pathname);

	if (!found) return;

	let onRendered: (() => void) | undefined;
	const renderPromise = new Promise<void>((resolve) => {
		onRendered = resolve;
	});

	let redirected: boolean | undefined;
	let status: number | undefined = undefined;
	const headers = new Headers({
		"Content-Type": "text/html; charset=utf-8",
	});

	function updateHeaders(props: ResponseContextProps) {
		redirected = redirected ?? props.redirect;
		status = status ?? props.status;

		if (props.headers) {
			for (const [key, value] of Object.entries(props.headers)) {
				const values = Array.isArray(value) ? value : [value];
				for (const v of values) {
					headers.append(key, v);
				}
			}
		}
	}

	let app = (
		<div id="root">
			<ResponseContext.Provider value={updateHeaders}>
				<RouteContext.Provider value={{ onRendered, found }}>
					<Suspense fallback={null}>
						<App />
					</Suspense>
				</RouteContext.Provider>
			</ResponseContext.Provider>
		</div>
	);

	const moduleIds = found.route[2];

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
			cssOutput += `<link rel="stylesheet" href=${escapeHtml("/" + cssFile)}>`;
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
			// TODO: AbortController
			bootstrapModules: ["/" + scriptPath],
		});

	await renderPromise;

	const userAgent = req.headers.get("user-agent");
	if (userAgent && isBot(userAgent)) {
		await reactStream.allReady;
	} else {
		await Promise.race([
			reactStream.allReady,
			new Promise<void>((resolve) => {
				setTimeout(resolve, SSR_TIMEOUT);
			}),
		]);
	}

	if (redirected) {
		return new Response(redirectBody(headers.get("location")!), {
			status,
			headers,
		});
	}

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

	head += `</head><body>`;

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

			controller.enqueue(textEncoder.encode("</body></html>"));
			controller.close();
		},
	});

	return new Response(wrapperStream, { status, headers });
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;");
}

const REACT_FAST_REFRESH_PREAMBLE = `import RefreshRuntime from '/@react-refresh'
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true`;

function redirectBody(href: string) {
	const escaped = escapeHtml(href);

	// http-equiv="refresh" is useful for static prerendering
	return `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${escaped}"></head><body><a href="${escaped}">${escaped}</a></body></html>`;
}

const SSR_TIMEOUT = 0;
