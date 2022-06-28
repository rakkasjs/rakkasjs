/// <reference types="vite/client" />

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
import { RequestContext } from "@hattip/compose";
import {
	IsomorphicContext,
	ServerSideContext,
} from "../../runtime/isomorphic-context";
import { QueryContext } from "../use-query/implementation";
import { Default404Page } from "./Default404Page";

export default async function doRenderPageRoute(
	ctx: RequestContext,
): Promise<Response | undefined> {
	ctx.locals = {};

	const pageHooks = ctx.hooks.map((hook) => hook.createPageHooks?.(ctx));

	const routes = (await import("virtual:rakkasjs:server-page-routes")).default;

	let {
		url: { pathname },
	} = ctx;

	let found = findRoute(routes, pathname);

	if (!found && !ctx.notFound) return;

	while (!found) {
		if (!pathname.endsWith("/")) {
			pathname += "/";
		}

		found = findRoute(routes, pathname + "%24404");
		if (found) {
			break;
		}

		if (pathname === "/") {
			found = {
				params: {},
				route: [/^\/$/, [async () => ({ default: Default404Page })], []],
			};
		}

		// Throw away the last path segment
		pathname = pathname.split("/").slice(0, -2).join("/") || "/";
	}

	let redirected: boolean | undefined;
	let status: number | undefined = ctx.notFound ? 404 : undefined;
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

	const queryContext: QueryContext = {} as any;

	for (const hook of pageHooks) {
		hook?.augmentQueryContext?.(queryContext);
	}

	let app = (
		<ServerSideContext.Provider value={ctx}>
			<IsomorphicContext.Provider value={queryContext}>
				<App />
			</IsomorphicContext.Provider>
		</ServerSideContext.Provider>
	);

	const reversePageHooks = [...pageHooks].reverse();
	for (const hooks of reversePageHooks) {
		if (hooks?.wrapApp) {
			app = hooks.wrapApp(app);
		}
	}

	let resolveRenderPromise: () => void;
	let rejectRenderPromise: (err: unknown) => void;

	const renderPromise = new Promise<void>((resolve, reject) => {
		resolveRenderPromise = resolve;
		rejectRenderPromise = reject;
	});

	app = (
		<div id="root">
			<ResponseContext.Provider value={updateHeaders}>
				<RouteContext.Provider
					value={{
						onRendered() {
							resolveRenderPromise();
						},
						found,
					}}
				>
					<Suspense>{app}</Suspense>
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

	const reactStream = await renderToReadableStream(
		<StrictMode>{app}</StrictMode>,
		{
			// TODO: AbortController
			bootstrapModules: ["/" + scriptPath],
			onError(error) {
				status = 500;
				rejectRenderPromise(error);
			},
		},
	);

	try {
		await renderPromise;

		const userAgent = ctx.request.headers.get("user-agent");
		if (userAgent && isBot(userAgent)) {
			await reactStream.allReady;
		} else {
			await Promise.resolve();
			// await Promise.race([
			// 	reactStream.allReady,
			// 	new Promise<void>((resolve) => {
			// 		setTimeout(resolve, SSR_TIMEOUT);
			// 	}),
			// ]);
		}
	} catch (error) {
		console.error(error);
		status = 500;
	}

	if (redirected) {
		return new Response(redirectBody(headers.get("location")!), {
			status,
			headers,
		});
	}

	// TODO: Customize HTML document
	let head =
		`<!DOCTYPE html><html><head>` +
		cssOutput +
		`<meta charset="UTF-8" />` +
		`<meta name="viewport" content="width=device-width, initial-scale=1.0" />` +
		`<meta http-equiv="X-UA-Compatible" content="ie=edge" />`;

	for (const hooks of pageHooks) {
		if (hooks?.emitToDocumentHead) {
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
				for (const hooks of pageHooks) {
					if (hooks?.emitBeforeSsrChunk) {
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

// TODO: Customize redirect document
function redirectBody(href: string) {
	const escaped = escapeHtml(href);

	// http-equiv="refresh" is useful for static prerendering
	return `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${escaped}"></head><body><a href="${escaped}">${escaped}</a></body></html>`;
}
