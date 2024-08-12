/// <reference types="vite/client" />
import React, { StrictMode } from "react";
import {
	renderToReadableStream,
	renderToStaticMarkup,
} from "react-dom/server.browser";
import clientManifest from "rakkasjs:client-manifest";
import { App, RouteContext } from "../../runtime/App";
import { isBot } from "../../runtime/isbot";
import { findPage, type RouteMatch } from "../../internal/find-page";
import {
	ResponseContext,
	type ResponseContextProps,
} from "../response-manipulation/implementation";
import type { RequestContext } from "@hattip/compose";
import {
	IsomorphicContext,
	ServerSideContext,
} from "../../runtime/isomorphic-context";
import { Default404Page } from "./Default404Page";
import type {
	ActionResult,
	LayoutImporter,
	PageImporter,
	PageRouteGuard,
	PrerenderResult,
	ServerSidePageContext,
	PageContext,
	Redirection,
} from "../../runtime/page-types";
import { uneval } from "devalue";
import viteDevServer from "@vavite/expose-vite-dev-server/vite-dev-server";
import type { PageRequestHooks } from "../../runtime/hattip-handler";
import type { ModuleNode } from "vite";
import { escapeCss, escapeHtml, sortHooks } from "../../runtime/utils";
import { commonHooks } from "../../runtime/feature-common-hooks";
import { renderHeadContent } from "../head/server-hooks";
import type { HeadElement } from "../head/implementation/types";
import { composableActionData } from "../run-server-side/lib-server";
import ErrorComponent from "rakkasjs:error-page";
import { acceptsDevalue } from "../../internal/accepts-devalue";

const assetPrefix = import.meta.env.BASE_URL ?? "/";

const pageContextMap = new WeakMap<Request, PageContext>();

export default async function renderPageRoute(
	ctx: RequestContext,
): Promise<Response | undefined> {
	if (ctx.method === "POST" && ctx.url.searchParams.get("_action")) {
		return;
	}

	const pageHooks = ctx.rakkas.hooks.map((hook) => hook.createPageHooks?.(ctx));

	const extendPageContextHandlers = sortHooks([
		...pageHooks.map((hook) => hook?.extendPageContext),
		...commonHooks.map((hook) => hook.extendPageContext),
	]);

	const { default: routes, notFoundRoutes } = await import(
		"rakkasjs:server-page-routes"
	);

	let {
		url: { pathname },
	} = ctx;

	let pageContext = pageContextMap.get(ctx.request);

	if (!pageContext) {
		pageContext = { url: ctx.url, locals: {} } as any as PageContext;

		for (const handler of extendPageContextHandlers) {
			await handler(pageContext);
		}

		pageContextMap.set(ctx.request, pageContext);
	}

	let found:
		| Redirection
		| RouteMatch<
				[
					regexp: RegExp,
					importers: [PageImporter, ...LayoutImporter[]],
					guards: PageRouteGuard<Record<string, string>>[],
					rest: string | undefined,
					ids: string[],
					/** undefined = hydrate, 1 = server, 2 = client */
					mode?: 1 | 2,
				]
		  >
		| undefined;

	if (ctx.rakkas.notFound) {
		do {
			if (!pathname.endsWith("/")) {
				pathname += "/";
			}

			found = (await findPage(
				notFoundRoutes,
				ctx.url,
				pathname + "$404",
				pageContext,
				true,
			)) as any;

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
					renderedUrl: ctx.url,
				};
			}

			// Throw away the last path segment
			pathname = pathname.split("/").slice(0, -2).join("/") || "/";
		} while (!found);
	} else {
		pathname = ctx.url.pathname;
		const result = await findPage(
			routes,
			ctx.url,
			pathname,
			pageContext,
			false,
		);

		found = result;

		if (!found) return;
	}

	if (found && "redirect" in found) {
		const location = String(found.redirect);
		return new Response(redirectBody(location), {
			status: (found.status ?? found.permanent) ? 301 : 302,
			headers: makeHeaders(
				{
					location: new URL(location, ctx.url.origin).href,
					"content-type": "text/html; charset=utf-8",
				},
				found.headers,
			),
		});
	}

	let renderMode = (["hydrate", "server", "client"] as const)[
		found.route[5] ?? 0
	];

	const headers = new Headers({
		"Content-Type": "text/html; charset=utf-8",
	});

	let scriptId: string;
	let scriptPath: string | undefined;

	if (import.meta.env.PROD) {
		for (const [id, entry] of Object.entries(clientManifest!)) {
			if (entry.isEntry) {
				scriptId = "/" + id;
				scriptPath = entry.file;
				break;
			}
		}

		if (!scriptId!) throw new Error("Entry not found in client manifest");
	} else {
		scriptId = "rakkasjs:client-entry";
	}

	if (renderMode === "client" && ctx.method === "GET") {
		const prefetchOutput = await createPrefetchTags(ctx, [scriptId]);

		const head = renderHead(
			ctx,
			prefetchOutput,
			renderMode,
			undefined,
			undefined,
			pageHooks,
		);

		let html = head + `<div id="root"></div></body>`;

		html += `<script type="module" src="${
			scriptPath ? [assetPrefix + scriptPath] : ["/" + scriptId]
		}"></script>`;

		html += `</html>`;

		return new Response(html, {
			status: 200,
			headers,
		});
	}

	let redirected: boolean | undefined;
	let status: number;

	let hold =
		process.env.RAKKAS_PRERENDER === "true" ||
		import.meta.env.RAKKAS_DISABLE_STREAMING === "true"
			? true
			: 0;

	function updateHeaders(props: ResponseContextProps) {
		if (props.status) {
			status =
				typeof props.status === "function"
					? props.status(status)
					: props.status;
		}

		if (
			hold !== true &&
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
			reactStream.cancel().catch(() => {
				// Ignore
			});
		}
	}

	const importers = found.route[1];
	const preloadContext = {
		...pageContext,
		params: found.params,
	} as ServerSidePageContext;

	const modules = await Promise.all(importers.map((importer) => importer()));

	let actionResult: ActionResult<any> | undefined;
	let actionErrorIndex = -1;
	let actionError: any;

	if (ctx.method !== "GET") {
		const composable = composableActionData.get(ctx);

		if (composable) {
			actionResult = composable[1];
		} else {
			for (const [i, module] of modules.entries()) {
				if (module.action) {
					try {
						actionResult = await module.action(preloadContext);
					} catch (error) {
						actionError = error;
						actionErrorIndex = i;
					}
					break;
				}
			}
		}
	}

	if (acceptsDevalue(ctx)) {
		if (actionResult && "redirect" in actionResult) {
			actionResult.redirect = String(actionResult.redirect);
		}

		return new Response(uneval(actionResult), {
			status: actionErrorIndex >= 0 ? 500 : (actionResult?.status ?? 200),
			headers: makeHeaders(
				{ "content-type": "text/javascript; devalue" },
				actionResult?.headers,
			),
		});
	}

	if (actionResult && actionResult.redirect) {
		const location = new URL(actionResult.redirect, ctx.url.origin).href;
		return new Response(redirectBody(location), {
			status: actionResult.status ?? 302,
			headers: makeHeaders(
				{
					location,
					"content-type": "text/html; charset=utf-8",
				},
				actionResult.headers,
			),
		});
	}

	status = actionResult?.status ?? (ctx.rakkas.notFound ? 404 : 200);

	pageContext.actionData = actionResult?.data;
	preloadContext.actionData = actionResult?.data;
	const reverseModules = modules.reverse();

	const preloaded = await Promise.all(
		reverseModules.map(async (m, i) => {
			try {
				if (i === modules.length - 1 - actionErrorIndex) {
					throw new Error(actionError);
				}

				const preloaded = await m.default?.preload?.(preloadContext);
				return preloaded;
			} catch (preloadError) {
				// If a preload function throws, we return a component that
				// throws the same error.
				modules[i] = {
					default() {
						throw preloadError;
					},
				};
			}
		}),
	);

	const meta: any = {};
	preloaded.forEach((p) =>
		typeof p?.meta === "function" ? p.meta(meta) : Object.assign(meta, p?.meta),
	);

	let app = (
		<App
			ssrActionData={actionResult?.data}
			ssrMeta={meta}
			ssrPreloaded={preloaded}
			ssrModules={modules}
		/>
	);

	const wrapAppHandlers = sortHooks([
		...pageHooks.map((hook) => hook?.wrapApp),
		...commonHooks.map((hook) => hook.wrapApp),
	]).reverse();

	for (const handler of wrapAppHandlers) {
		app = handler(app);
	}

	app = (
		<ServerSideContext.Provider value={ctx}>
			<IsomorphicContext.Provider value={pageContext}>
				{app}
			</IsomorphicContext.Provider>
		</ServerSideContext.Provider>
	);

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
						found,
					}}
				>
					{app}
				</RouteContext.Provider>
			</ResponseContext.Provider>
		</div>
	);

	if (import.meta.env.DEV && process.env.RAKKAS_STRICT_MODE === "true") {
		app = <StrictMode>{app}</StrictMode>;
	}

	const bootstrapModules =
		renderMode === "server"
			? []
			: scriptPath
				? [assetPrefix + scriptPath]
				: ["/" + scriptId];
	let onErrorCalled = false;
	const reactStream = await renderToReadableStream(app, {
		// TODO: AbortController
		bootstrapModules,
		onError(error: any) {
			onErrorCalled = true;
			if (!redirected) {
				status = 500;
				if (error && typeof error.toResponse === "function") {
					void Promise.resolve(error.toResponse()).then(
						(response: Response) => {
							status = response.status;
						},
					);
				} else if (process.env.RAKKAS_PRERENDER) {
					(ctx.platform as any).reportError(error);
				} else {
					console.error(error);
				}
			}
		},
	}).catch(async (error) => {
		if (!onErrorCalled && !redirected) {
			status = 500;
			if (error && typeof error.toResponse === "function") {
				const response = await error.toResponse();
				status = response.status;
			} else if (process.env.RAKKAS_PRERENDER) {
				(ctx.platform as any).reportError(error);
			} else {
				console.error(error);
			}
		}

		// Well render an Internal Error page and let the client take over
		renderMode = "client";
		return renderToReadableStream(
			<ServerSideContext.Provider value={ctx}>
				<IsomorphicContext.Provider value={pageContext}>
					<div id="root">
						<ErrorComponent
							error={new Error("Internal Error")}
							resetErrorBoundary={() => {}}
						/>
					</div>
				</IsomorphicContext.Provider>
			</ServerSideContext.Provider>,
			{
				bootstrapModules,
			},
		);
	});

	try {
		const userAgent = ctx.request.headers.get("user-agent");
		if (hold === true || (userAgent && isBot(userAgent))) {
			await reactStream.allReady;
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
			} else if (process.env.RAKKAS_PRERENDER) {
				(ctx.platform as any).reportError(error);
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

	const prefetchOutput = await createPrefetchTags(ctx, [
		scriptId,
		...found.route[4],
	]);

	const head = renderHead(
		ctx,
		prefetchOutput,
		renderMode,
		actionResult?.data,
		actionErrorIndex,
		pageHooks,
	);

	const wrapSsrStreamHandlers = sortHooks(
		pageHooks.map((hook) => hook?.wrapSsrStream),
	);

	let wrapperStream: ReadableStream = reactStream;
	for (const handler of wrapSsrStreamHandlers) {
		wrapperStream = handler(wrapperStream);
	}

	const textEncoder = new TextEncoder();

	const { readable, writable } = new TransformStream();

	// Response.prototype.text() implementation has a a bug in Node 14 and 16
	// which breaks prerendering. So if streaming is disabled, we can simply buffer
	// everything ourselves.
	const bufferedChunks: Uint8Array[] = [];
	const writer =
		hold === true
			? {
					write(chunk: Uint8Array) {
						bufferedChunks.push(chunk);
					},
					close() {
						// Ignore
					},
				}
			: writable.getWriter();

	const emitBeforeSsrChunkHandlers = sortHooks(
		pageHooks.map((hook) => hook?.emitBeforeSsrChunk),
	);

	async function pipe() {
		await writer.write(textEncoder.encode(head));
		for await (const chunk of wrapperStream as any) {
			for (const handler of emitBeforeSsrChunkHandlers) {
				const text = handler();
				if (text) {
					await writer.write(textEncoder.encode(text));
				}
			}

			await writer.write(chunk);
		}

		await writer.write(textEncoder.encode("</body></html>"));

		await writer.close();
	}

	const pipePromise = pipe().catch(() => {
		// Ignore
	});

	if (hold === true) {
		await pipePromise;
		// Merge buffered chunks
		const output = new Uint8Array(
			bufferedChunks.reduce((acc, chunk) => acc + chunk.length, 0),
		);
		let offset = 0;
		for (const chunk of bufferedChunks) {
			output.set(chunk, offset);
			offset += chunk.length;
		}

		return new Response(output, { status, headers });
	}

	ctx.waitUntil(pipePromise);
	return new Response(readable, { status, headers });
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

function makeHeaders(
	init: HeadersInit,
	headers?: Record<string, string | string[]> | ((headers: Headers) => void),
) {
	const result = new Headers(init);

	if (typeof headers === "function") {
		headers(result);
	} else if (headers) {
		for (const [header, value] of Object.entries(headers)) {
			if (Array.isArray(value)) {
				for (const v of value) {
					result.append(header, v);
				}
			} else {
				result.set(header, value);
			}
		}
	}

	return result;
}

async function createPrefetchTags(ctx: RequestContext, moduleIds: string[]) {
	const pageUrl = ctx.url;
	let result = "";

	if (!viteDevServer) {
		moduleIds = moduleIds.map((id) => id.slice(1));
		// Add this manually because it's a dynamic import
		moduleIds.push("virtual:rakkasjs:client-page-routes");
		const moduleSet = new Set(moduleIds);
		const cssSet = new Set<string>();
		// const assetSet = new Set<string>();

		const elements: HeadElement[] = [];
		for (const moduleId of moduleSet) {
			const manifestEntry = clientManifest?.[moduleId];
			if (!manifestEntry) continue;

			manifestEntry.imports?.forEach((id) => moduleSet.add(id));
			manifestEntry.css?.forEach((id) => cssSet.add(id));
			// manifestEntry.assets?.forEach((id) => assetSet.add(id));

			const script = clientManifest?.[moduleId].file;
			if (script) {
				elements.push({
					tagName: "link",
					rel: "modulepreload",
					href: assetPrefix + script,
					crossorigin: "" as any,
					"data-sr": true,
				});
			}
		}

		for (const cssFile of cssSet) {
			elements.push({
				tagName: "link",
				rel: "stylesheet",
				href: assetPrefix + cssFile,
				"data-sr": true,
			});
		}

		ctx.rakkas.head.push({ elements });

		// TODO: Prefetch/preload assets
		// for (const assetFile of assetSet) {
		// 	prefetchOutput += `<link rel="prefetch" href="${escapeHtml(
		// 		"/" + assetFile,
		// 	)}">`;
		// }
	} else {
		// Force loading the client entry module so that we can get the list of
		// modules imported by it.
		await viteDevServer
			.transformRequest("rakkasjs:client-entry")
			.catch(() => null);

		const moduleSet = new Set(moduleIds);
		const cssSet = new Map<string, string>();

		for (const moduleUrl of moduleSet) {
			const module:
				| (ModuleNode & { ssrImportedModules?: Set<ModuleNode> })
				| undefined = await viteDevServer.moduleGraph.getModuleByUrl(moduleUrl);

			if (!module) continue;

			const importedModules = [
				...(module.ssrImportedModules ?? []),
				...(module.clientImportedModules ?? []),
			].map((m) => ({ id: m.id, url: m.url }));

			for (const imported of importedModules) {
				const url = new URL(imported.url, pageUrl);
				url.searchParams.delete("v");
				url.searchParams.delete("t");
				if (url.href.match(/\.(css|scss|sass|less|styl|stylus)$/)) {
					if (imported.id) cssSet.set(imported.id, imported.url);
				} else if (url.href.match(/\.(js|jsx|ts|tsx)$/)) {
					moduleSet.add(imported.url);
				}
			}
		}

		for (const [id, url] of cssSet) {
			const directUrl = url + (url.includes("?") ? "&" : "?") + "direct";
			const transformed = await viteDevServer.transformRequest(directUrl);
			if (!transformed) continue;
			result += `<style type="text/css" data-vite-dev-id=${JSON.stringify(
				id,
			)}>${escapeCss(transformed.code)}</style>`;
		}
	}

	return result;
}

function renderHead(
	ctx: RequestContext,
	prefetchOutput: string,
	renderMode: "server" | "hydrate" | "client",
	actionData: unknown = undefined,
	actionErrorIndex = -1,
	pageHooks: Array<PageRequestHooks | undefined> = [],
) {
	// TODO: Customize HTML document

	const browserGlobal: typeof rakkas = { headTagStack: [], headOrder: 0 };
	if (actionErrorIndex >= 0 && renderMode !== "server") {
		browserGlobal.actionErrorIndex = actionErrorIndex;
	}

	if (actionData !== undefined && renderMode !== "server") {
		// TODO: Refactor this. Probably belongs to client-side-navigation
		browserGlobal.actionData = actionData;
	}

	if (renderMode === "client") {
		browserGlobal.clientRender = true;
	}

	const script: HeadElement = {
		tagName: "script",
		"data-sr": true,
		textContent: `rakkas=${uneval(browserGlobal)};`,
	};

	const emitToSyncHeadScriptHandlers = sortHooks(
		pageHooks.map((hook) => hook?.emitToSyncHeadScript),
	);

	for (const handler of emitToSyncHeadScriptHandlers) {
		const body = handler();
		if (!body) continue;

		script.textContent += body;
	}

	ctx.rakkas.head.push({ elements: [script] });

	const emitServerOnlyHeadElementsHandlers = sortHooks(
		pageHooks.map((hook) => hook?.emitServerOnlyHeadElements),
	);

	for (const handler of emitServerOnlyHeadElementsHandlers) {
		const head = handler();
		if (!head) continue;

		ctx.rakkas.head.push({
			elements: head.map((e) => ({ ...e, "data-sr": true })),
		});
	}

	const { specialAttributes, content: managedHead } = renderHeadContent(
		ctx.url.pathname + ctx.url.search,
		ctx.rakkas.head,
	);

	let result = managedHead;

	const emitToDocumentHeadHandlers = sortHooks(
		// eslint-disable-next-line deprecation/deprecation
		pageHooks.map((hook) => hook?.emitToDocumentHead),
	);

	for (const handler of emitToDocumentHeadHandlers) {
		const head = handler();
		if (!head) continue;

		const headStr =
			typeof head === "string" ? head : renderToStaticMarkup(head);

		result += headStr;
	}

	result =
		`<!DOCTYPE html><html${stringifyAttributes(
			specialAttributes.htmlAttributes,
		)}><head${stringifyAttributes(specialAttributes.headAttributes)}>` + result;

	result += prefetchOutput;

	if (import.meta.env.DEV) {
		result +=
			`<script type="module" src="/@vite/client"></script>` +
			`<script type="module" async>${REACT_FAST_REFRESH_PREAMBLE}</script>`;
	}

	result += `</head><body${stringifyAttributes(
		specialAttributes.bodyAttributes,
	)}>`;

	return result;
}

function stringifyAttributes(
	attributes: Record<string, string | number | boolean | undefined>,
) {
	let result = "";
	for (const [key, value] of Object.entries(attributes)) {
		if (
			["key", "textContent", "innerHTML", "children", "tagName"].includes(
				key,
			) ||
			value === false ||
			value === undefined
		) {
			continue;
		}

		if (value === true) {
			result += ` ${escapeHtml(key)}`;
			continue;
		}

		result += ` ${escapeHtml(key)}="${escapeHtml(String(value))}"`;
	}

	return result;
}
