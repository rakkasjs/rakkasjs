/// <reference types="vite/client" />

import React, { Fragment, StrictMode, Suspense } from "react";
import { renderToReadableStream } from "react-dom/server.browser";
import clientManifest from "virtual:rakkasjs:client-manifest";
import { App, RouteContext } from "../../runtime/App";
import { isBot } from "../../runtime/isbot";
import { findPage, RouteMatch } from "../../internal/find-page";
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
import { LookupHookResult } from "../../lib";

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
		pageContext = { url: ctx.url, locals: {} } as any as PageContext;

		for (const hook of pageHooks) {
			await hook?.extendPageContext?.(pageContext);
		}
		await commonHooks.extendPageContext?.(pageContext);

		pageContextMap.set(ctx.request, pageContext);
	}

	let found:
		| RouteMatch<
				[
					regexp: RegExp,
					importers: [PageImporter, ...LayoutImporter[]],
					guards: PageRouteGuard<Record<string, string>>[],
					rest: string | undefined,
					ids: string[],
				]
		  >
		| undefined;

	const beforePageLookupHandlers: Array<
		(ctx: PageContext, url: URL) => LookupHookResult
	> = [commonHooks.beforePageLookup].filter(Boolean) as any;

	if (ctx.notFound) {
		do {
			if (!pathname.endsWith("/")) {
				pathname += "/";
			}

			found = findPage(routes, pathname + "%24404");
			if (found) {
				break;
			}

			if (pathname === "/") {
				found = {
					params: {},
					route: [
						/^\/$/,
						[async () => ({ default: Default404Page })],
						[],
						undefined,
						[],
					],
				};
			}

			// Throw away the last path segment
			pathname = pathname.split("/").slice(0, -2).join("/") || "/";
		} while (!found);
	} else {
		for (const hook of beforePageLookupHandlers) {
			const result = hook(pageContext, pageContext.url);

			if (!result) return;

			if (result === true) continue;

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

		const result = findPage(routes, pathname, pageContext);

		if (result && "redirect" in result) {
			const location = String(result.redirect);
			return new Response(redirectBody(location), {
				status: result.status ?? result.permanent ? 301 : 302,
				headers: {
					location: new URL(location, ctx.url.origin).href,
					"content-type": "text/html; charset=utf-8",
				},
			});
		}

		found = result;

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
				i().then(async (m) => {
					try {
						const preloaded = await m.default?.preload?.(preloadContext);
						return [m, preloaded];
					} catch (preloadError) {
						// If a preload function throws, we return a component that
						// throws the same error.
						return [
							() => {
								throw preloadError;
							},
						];
					}
				}),
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
				<App
					beforePageLookupHandlers={beforePageLookupHandlers}
					ssrMeta={meta}
				/>
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

	let scriptPath: string;
	if (import.meta.env.PROD) {
		for (const entry of Object.values(clientManifest!)) {
			if (entry.isEntry) {
				scriptPath = entry.file;
				break;
			}
		}
	} else {
		scriptPath = "virtual:rakkasjs:client-entry";
	}

	const reactStream = await renderToReadableStream(
		<StrictMode>{app}</StrictMode>,
		{
			// TODO: AbortController
			bootstrapModules: ["/" + scriptPath!],
			onError(error: any) {
				if (!redirected) {
					status = 500;
					if (error && typeof error.toResponse === "function") {
						Promise.resolve(error.toResponse()).then((response: Response) => {
							status = response.status;
						});
					}
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
	} catch (error: any) {
		if (!redirected) {
			if (error && typeof error.toResponse === "function") {
				const response = await error.toResponse();
				status = response.status;
			} else {
				console.error(error);
				status = 500;
			}
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

	let wrapperStream: ReadableStream = reactStream;
	for (const hooks of pageHooks) {
		if (hooks?.wrapSsrStream) {
			wrapperStream = hooks.wrapSsrStream(wrapperStream);
		}
	}

	const textEncoder = new TextEncoder();

	const { readable, writable } = new TransformStream();

	const writer = writable.getWriter();

	async function pipe() {
		writer.write(textEncoder.encode(head));
		for await (const chunk of wrapperStream as any) {
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
