/// <reference types="vite/client" />

import { RequestContext } from "../lib";
import { LayoutModule } from "./page-types";
import React, { ReactNode } from "react";
// @ts-expect-error: React 18 types aren't ready yet
import { renderToReadableStream } from "react-dom/server.browser";
import clientManifest from "virtual:rakkasjs:client-manifest";
import { SsrCacheContext } from "./ssr-cache";
import { CreateServerHooksFn } from "./server-hooks";

// Builtin hooks
import createReactHelmentServerHooks from "./builtin-server-hooks/react-helmet-async";

const hookFns: CreateServerHooksFn[] = [createReactHelmentServerHooks];

export async function renderPageRoute(
	req: Request,
	ctx: RequestContext<Record<string, string>>,
): Promise<Response | undefined> {
	ctx.locals = {};

	const hooksObjects = hookFns.map((fn) => fn(req, ctx));

	const pageRoutes = await import("virtual:rakkasjs:server-page-routes");

	for (const [regex, descriptors] of pageRoutes.default) {
		const match = regex.exec(ctx.url.pathname);
		if (!match) continue;

		ctx.params = match.groups || {};

		const modules = (await Promise.all(
			descriptors.map(([, importer]) => importer()),
		)) as LayoutModule[];

		const content = modules.reduce(
			(prev, { default: Component = ({ children }) => <>{children}</> }) => (
				<Component children={prev} params={ctx.params} url={ctx.url} />
			),
			null as ReactNode,
		);

		const moduleIds = descriptors.map((m) => m[0]);

		let moduleNames: string[];
		let cssOutput = "";

		if (import.meta.env.DEV) {
			// No manifest for dev
			moduleNames = moduleIds.map((id) => "/" + id);
		} else {
			moduleNames = moduleIds.map(
				(id) => "/" + (clientManifest?.[id]?.file || id),
			);

			const moduleSet = new Set(moduleIds);
			const cssSet = new Set<string>();

			for (const moduleId of moduleSet) {
				const manifestEntry = clientManifest?.[moduleId];
				if (!manifestEntry) continue;

				manifestEntry.imports?.forEach((id) => moduleSet.add(id));
				manifestEntry.dynamicImports?.forEach((id) => moduleSet.add(id));
				manifestEntry.css?.forEach((id) => cssSet.add(id));
			}

			for (const cssFile of cssSet) {
				cssOutput += `<link rel="stylesheet" href=${escapedJson(
					"/" + cssFile,
				)}>`;
			}
		}

		let scriptPath = "virtual:rakkasjs:client-entry";
		if (import.meta.env.PROD) {
			scriptPath = clientManifest![scriptPath]?.file ?? scriptPath;
		}

		const cache = {
			_items: Object.create(null) as Record<string, any>,

			_newItems: Object.create(null) as Record<string, any>,

			_hasNewItems: false,

			_getNewItems() {
				const items = this._newItems;
				this._newItems = Object.create(null);
				this._hasNewItems = false;
				return items;
			},

			get(key: string) {
				return this._items[key];
			},

			set(key: string, value: any) {
				this._items[key] = value;
				this._newItems[key] = value;
				this._hasNewItems = true;
			},
		};

		let app: ReactNode = <div id="root">{content}</div>;

		for (const hooks of hooksObjects) {
			if (hooks.wrapApp) {
				app = hooks.wrapApp(app);
			}
		}

		const html = (
			<SsrCacheContext.Provider value={cache}>{app}</SsrCacheContext.Provider>
		);

		const reactStream: ReadableStream & { allReady: Promise<void> } =
			await renderToReadableStream(html, {
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

		head += `<script>$RAKKAS_SSR_CACHE=Object.create(null);$RAKKAS_PAGE_MODULES=${escapedJson(
			moduleNames,
		)};$RAKKAS_PATH_PARAMS=${escapedJson(ctx.params)}</script>`;

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

					if (cache._hasNewItems) {
						const newItems = cache._getNewItems();
						const newItemsString = escapedJson(newItems);
						controller.enqueue(
							textEncoder.encode(
								`<script>Object.assign($RAKKAS_SSR_CACHE,${newItemsString})</script>`,
							),
						);
					}

					controller.enqueue(chunk);
				}

				controller.enqueue(textEncoder.encode("</body></html>"));

				controller.close();
			},
		});

		return new Response(wrapperStream, {
			headers: { "Content-Type": "text/html; charset=utf-8" },
		});
	}

	return;
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
