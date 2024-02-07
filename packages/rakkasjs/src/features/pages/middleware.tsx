/// <reference types="vite/client" />
import React, { StrictMode, Suspense } from "react";
import {
	renderToReadableStream,
	renderToStaticMarkup,
} from "react-dom/server.browser";
import clientManifest from "rakkasjs:client-manifest";
import { App, RouteContext } from "../../runtime/App";
import { isBot } from "../../runtime/isbot";
import { findPage, RouteMatch } from "../../internal/find-page";
import {
	ResponseContext,
	ResponseContextProps,
} from "../response-manipulation/implementation";
import { RequestContext } from "@hattip/compose";
import {
	IsomorphicContext,
	ServerSideContext,
} from "../../runtime/isomorphic-context";
import type { PageContext } from "../../runtime/page-types";
import { Default404Page } from "./Default404Page";
import {
	ActionResult,
	LayoutImporter,
	PageImporter,
	PageRouteGuard,
	PrerenderResult,
	ServerSidePageContext,
} from "../../runtime/page-types";
import { uneval } from "devalue";
import viteDevServer from "@vavite/expose-vite-dev-server/vite-dev-server";
import { PageRequestHooks } from "../../runtime/hattip-handler";
import { ModuleNode } from "vite";
import { escapeCss, escapeHtml, sortHooks } from "../../runtime/utils";
import { commonHooks } from "../../runtime/feature-common-hooks";

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

			found = findPage(
				notFoundRoutes,
				ctx.url,
				pathname + "$404",
				pageContext,
				true,
			) as any;

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
		const result = findPage(routes, ctx.url, pathname, pageContext, false);

		if (result && "redirect" in result) {
			const location = String(result.redirect);
			return new Response(redirectBody(location), {
				status: result.status ?? result.permanent ? 301 : 302,
				headers: makeHeaders(
					{
						location: new URL(location, ctx.url.origin).href,
						"content-type": "text/html; charset=utf-8",
						vary: "accept",
					},
					result.headers,
				),
			});
		}

		found = result;

		if (!found) return;
	}

	const renderMode = (["hydrate", "server", "client"] as const)[
		found.route[5] ?? 0
	];

	const dataOnly =
		ctx.request.headers.get("accept") === "application/javascript";

	const headers = new Headers({
		"Content-Type": "text/html; charset=utf-8",
		Vary: "accept",
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

	if (renderMode === "client" && ctx.method === "GET" && !dataOnly) {
		const prefetchOutput = await createPrefetchTags(ctx.url, [scriptId]);

		const head = renderHead(
			prefetchOutput,
			renderMode,
			undefined,
			undefined,
			pageHooks,
		);
		const html = head + `<div id="root"></div></body></html>`;

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

	if (dataOnly) {
		if (actionResult && "redirect" in actionResult) {
			actionResult.redirect = String(actionResult.redirect);
		}

		return new Response(uneval(actionResult), {
			status: actionErrorIndex >= 0 ? 500 : actionResult?.status ?? 200,
			headers: makeHeaders(
				{
					"content-type": "application/javascript",
					vary: "accept",
				},
				actionResult?.headers,
			),
		});
	}

	if (actionResult && "redirect" in actionResult) {
		const location = String(actionResult.redirect);
		return new Response(redirectBody(location), {
			status: actionResult.status ?? actionResult.permanent ? 301 : 302,
			headers: makeHeaders(
				{
					location: new URL(location, ctx.url.origin).href,
					"content-type": "text/html; charset=utf-8",
					vary: "accept",
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

	if (import.meta.env.DEV && process.env.RAKKAS_STRICT_MODE === "true") {
		app = <StrictMode>{app}</StrictMode>;
	}

	const reactStream = await renderToReadableStream(app, {
		// TODO: AbortController
		bootstrapModules:
			renderMode === "server"
				? []
				: scriptPath
					? [assetPrefix + scriptPath]
					: ["/" + scriptId],

		onError(error: any) {
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
			rejectRenderPromise(error);
		},
	});

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

	const prefetchOutput = await createPrefetchTags(ctx.url, [
		scriptId,
		...found.route[4].map((id) => "/" + id),
	]);

	const head = renderHead(
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

async function createPrefetchTags(pageUrl: URL, moduleIds: string[]) {
	let result = "";

	if (!viteDevServer) {
		moduleIds = moduleIds.map((id) => id.slice(1));
		// Add this manually because it's a dynamic import
		moduleIds.push("virtual:rakkasjs:client-page-routes");
		const moduleSet = new Set(moduleIds);
		const cssSet = new Set<string>();
		// const assetSet = new Set<string>();

		for (const moduleId of moduleSet) {
			const manifestEntry = clientManifest?.[moduleId];
			if (!manifestEntry) continue;

			// TODO: Prefetch modules and other assets
			manifestEntry.imports?.forEach((id) => moduleSet.add(id));
			manifestEntry.css?.forEach((id) => cssSet.add(id));
			// manifestEntry.assets?.forEach((id) => assetSet.add(id));

			const script = clientManifest?.[moduleId].file;
			if (script) {
				result += `<link rel="modulepreload" crossorigin href="${escapeHtml(
					assetPrefix + script,
				)}">`;
			}
		}

		for (const cssFile of cssSet) {
			result += `<link rel="stylesheet" href="${escapeHtml(
				assetPrefix + cssFile,
			)}">`;
		}

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
	prefetchOutput: string,
	renderMode: "server" | "hydrate" | "client",
	actionData: unknown = undefined,
	actionErrorIndex = -1,
	pageHooks: Array<PageRequestHooks | undefined> = [],
) {
	// TODO: Customize HTML document
	const specialAttributes: {
		htmlAttributes: Record<string, string>;
		headAttributes: Record<string, string>;
		bodyAttributes: Record<string, string>;
	} = {
		htmlAttributes: {},
		headAttributes: {},
		bodyAttributes: {},
	};

	let result = "";

	const emitToDocumentHeadHandlers = sortHooks(
		pageHooks.map((hook) => hook?.emitToDocumentHead),
	);

	for (const handler of emitToDocumentHeadHandlers) {
		const head = handler(specialAttributes);
		if (!head) continue;

		const headStr =
			typeof head === "string" ? head : renderToStaticMarkup(head);

		result += headStr;
	}

	result =
		`<!DOCTYPE html><html${stringifyAttributes(
			specialAttributes.htmlAttributes,
		)}><head${stringifyAttributes(specialAttributes.headAttributes)}>` + result;

	if (actionErrorIndex >= 0 && renderMode !== "server") {
		result += `<script>$RAKKAS_ACTION_ERROR_INDEX=${actionErrorIndex}</script>`;
	}

	result +=
		prefetchOutput +
		(renderMode === "hydrate"
			? `<script>$RAKKAS_HYDRATE="hydrate"</script>`
			: "") +
		// TODO: Refactor this. Probably belongs to client-side-navigation
		(actionData === undefined && renderMode !== "server"
			? ""
			: `<script>$RAKKAS_ACTION_DATA=${uneval(actionData)}</script>`);

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

function stringifyAttributes(attributes: Record<string, string>) {
	let result = "";
	for (const [key, value] of Object.entries(attributes)) {
		if (
			["key", "textContent", "innerHTML", "children", "tagName"].includes(key)
		) {
			continue;
		}
		result += ` ${escapeHtml(key)}="${escapeHtml(value)}"`;
	}

	return result;
}
