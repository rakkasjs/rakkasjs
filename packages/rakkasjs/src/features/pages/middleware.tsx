/// <reference types="vite/client" />

import React, { Fragment, StrictMode, Suspense } from "react";
import { renderToReadableStream } from "react-dom/server.browser";
import clientManifest from "virtual:rakkasjs:client-manifest";
import { App, RouteContext } from "../../runtime/App";
import { isBot } from "../../runtime/isbot";
import { findRoute, RouteMatch } from "../../internal/find-route";
import {
	Redirect,
	ResponseContext,
	ResponseContextProps,
} from "../response-manipulation/implementation";
import { RequestContext } from "@hattip/compose";
import {
	IsomorphicContext,
	ServerSideContext,
} from "../../runtime/isomorphic-context";
import { PageContext } from "../use-query/implementation";
import { Default404Page } from "./Default404Page";
import commonHooks from "virtual:rakkasjs:common-hooks";
import {
	LayoutImporter,
	LayoutModule,
	PageImporter,
	PageModule,
	PageRouteGuard,
	PreloadResult,
	PrerenderResult,
	ServerSidePageContext,
} from "../../runtime/page-types";
import { BeforeRouteResult } from "../../lib";

const pageContextMap = new WeakMap<Request, PageContext>();

export default async function doRenderPageRoute(
	ctx: RequestContext,
): Promise<Response | undefined> {
	const pageHooks = ctx.hooks.map((hook) => hook.createPageHooks?.(ctx));

	const routes = (await import("virtual:rakkasjs:server-page-routes")).default;

	let {
		url: { pathname },
	} = ctx;

	let pageContext = pageContextMap.get(ctx.request);

	if (!pageContext) {
		pageContext = { url: ctx.url } as any as PageContext;

		for (const hook of pageHooks) {
			hook?.extendPageContext?.(pageContext);
		}
		commonHooks.extendPageContext?.(pageContext);

		pageContextMap.set(ctx.request, pageContext);
	}

	let found:
		| RouteMatch<
				[
					regexp: RegExp,
					importers: [PageImporter, ...LayoutImporter[]],
					guards: PageRouteGuard<Record<string, string>>[],
					ids: string[],
				]
		  >
		| undefined;

	const beforeRouteHandlers: Array<
		(ctx: PageContext, url: URL) => BeforeRouteResult
	> = [
		...pageHooks.map((hook) => hook?.beforeRoute),
		commonHooks.beforeRoute,
	].filter(Boolean) as any;

	if (ctx.notFound) {
		do {
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
					route: [/^\/$/, [async () => ({ default: Default404Page })], [], []],
				};
			}

			// Throw away the last path segment
			pathname = pathname.split("/").slice(0, -2).join("/") || "/";
		} while (!found);
	} else {
		for (const hook of beforeRouteHandlers) {
			const result = hook(pageContext, pageContext.url);

			if (!result) continue;

			if ("redirect" in result) {
				const location = String(result.redirect);
				return new Response(redirectBody(location), {
					status: result.status ?? result.permanent ? 301 : 302,
					headers: {
						location: new URL(location, ctx.url.origin).href,
						"content-type": "text/html; charset=utf-8",
					},
				});
			} else {
				// Rewrite
				pageContext.url = new URL(result.rewrite, pageContext.url);
			}
		}
		pathname = pageContext.url.pathname;

		found = findRoute(routes, pathname, pageContext);
		if (!found) return;
	}

	let redirected: boolean | undefined;
	let status: number = ctx.notFound ? 404 : 200;
	const headers = new Headers({
		"Content-Type": "text/html; charset=utf-8",
	});

	let hold = import.meta.env.RAKKAS_DISABLE_STREAMING === "true" ? true : 0;

	function updateHeaders(props: ResponseContextProps) {
		if (props.status) {
			status =
				typeof props.status === "function"
					? props.status(status)
					: props.status;
		}

		if (
			import.meta.env.RAKKAS_DISABLE_STREAMING !== "true" &&
			props.throttleRenderStream !== undefined
		) {
			hold = props.throttleRenderStream;
		}

		if (typeof props.headers === "function") {
			props.headers(headers);
		} else if (props.headers) {
			for (const [key, value] of Object.entries(props.headers)) {
				const values = Array.isArray(value) ? value : [value];
				for (const v of values) {
					headers.append(key, v);
				}
			}
		}

		if (props.redirect) {
			redirected = redirected ?? props.redirect;
			reactStream.cancel();
		}
	}

	const importers = found.route[1];
	const preloadContext = {
		...pageContext,
		params: found.params,
	} as ServerSidePageContext;

	const stack = (
		(await Promise.all(
			importers.map((i) =>
				i().then(async (m) => [m, await m.default?.preload?.(preloadContext)]),
			),
		)) as [
			[PageModule, PreloadResult | undefined],
			...[LayoutModule, PreloadResult | undefined][],
		]
	).reverse();

	const modules = stack.map((s) => s[0]);
	const preloaded = stack.map((s) => s[1]);

	const meta: any = {};
	preloaded.forEach((p) => Object.assign(meta, p?.meta));

	const preloadNode = preloaded.map((result, i) => (
		<Fragment key={i}>
			{result?.head}
			{result?.redirect && <Redirect {...result?.redirect} />}
		</Fragment>
	));

	let app = (
		<ServerSideContext.Provider value={ctx}>
			<IsomorphicContext.Provider value={pageContext}>
				{preloadNode}
				<App beforeRouteHandlers={beforeRouteHandlers} ssrMeta={meta} />
			</IsomorphicContext.Provider>
		</ServerSideContext.Provider>
	);

	const reversePageHooks = [...pageHooks].reverse();
	for (const hooks of reversePageHooks) {
		if (hooks?.wrapApp) {
			app = hooks.wrapApp(app);
		}
	}

	if (commonHooks.wrapApp) {
		app = commonHooks.wrapApp(app);
	}

	let resolveRenderPromise: () => void;
	let rejectRenderPromise: (err: unknown) => void;

	const renderPromise = new Promise<void>((resolve, reject) => {
		resolveRenderPromise = resolve;
		rejectRenderPromise = reject;
	});

	for (const m of modules) {
		const headers = await m.headers?.(preloadContext, meta);
		if (headers) {
			updateHeaders(headers);
		}

		if (process.env.RAKKAS_PRERENDER === "true") {
			let prerender: PrerenderResult = { links: [] };
			for (const m of modules) {
				const value = await m.prerender?.(preloadContext, meta);
				if (value) {
					prerender = {
						...prerender,
						...value,
						links: [...prerender.links!, ...(value.links ?? [])],
					};
				}
			}

			(ctx as any).platform.prerenderOptions = prerender;
		}
	}

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

	const moduleIds = found.route[3];

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
				if (!redirected) {
					status = 500;
				}
				rejectRenderPromise(error);
			},
		},
	);

	try {
		await renderPromise;
		await new Promise<void>((resolve) => {
			setTimeout(resolve, 0);
		});

		const userAgent = ctx.request.headers.get("user-agent");
		if (hold === true || (userAgent && isBot(userAgent))) {
			await reactStream.allReady;
			await new Promise<void>((resolve) => {
				setTimeout(resolve, 0);
			});
		} else if (hold > 0) {
			await Promise.race([
				reactStream.allReady,
				new Promise<void>((resolve) => {
					setTimeout(resolve, hold as number);
				}),
			]);
		}
	} catch (error) {
		if (!redirected) {
			console.error(error);
			status = 500;
		}
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
		`<meta name="viewport" content="width=device-width, initial-scale=1.0" />`;

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

	const { readable, writable } = new TransformStream();

	const writer = writable.getWriter();

	async function pipe() {
		writer.write(textEncoder.encode(head));
		for await (const chunk of reactStream as any) {
			for (const hooks of pageHooks) {
				if (hooks?.emitBeforeSsrChunk) {
					const text = hooks.emitBeforeSsrChunk();
					if (text) {
						writer.write(textEncoder.encode(text));
					}
				}
			}

			writer.write(chunk);
		}

		writer.write(textEncoder.encode("</body></html>"));

		writer.close();
	}

	const pipePromise = pipe();

	if (hold === true) {
		await pipePromise;
	} else {
		ctx.waitUntil(pipePromise);
	}

	return new Response(readable, { status, headers });
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
