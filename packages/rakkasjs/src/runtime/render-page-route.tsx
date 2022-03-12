/// <reference types="vite/client" />

import { RequestContext } from "../lib";
import { LayoutModule, PageModule } from "./page-types";
import React, { ReactNode } from "react";
// @ts-expect-error: React 18 types aren't ready yet
import { renderToReadableStream } from "react-dom/server.browser";
import clientManifest from "virtual:rakkasjs:client-manifest";
import { SsrCacheContext } from "./ssr-cache";
import { HelmetProvider, FilledContext } from "react-helmet-async";

export async function renderPageRoute(
	req: Request,
	ctx: RequestContext<Record<string, string>>,
): Promise<Response | undefined> {
	ctx.locals = {};

	const pageRoutes = await import("virtual:rakkasjs:server-page-routes");

	for (const [regex, descriptors] of pageRoutes.default) {
		const match = regex.exec(ctx.url.pathname);
		if (!match) continue;

		ctx.params = match.groups || {};

		const modules = (await Promise.all(
			descriptors.map(([, importer]) => importer()),
		)) as [PageModule, ...LayoutModule[]];

		const content = modules.reduce(
			(prev, { default: Component }) => <Component children={prev} />,
			null as ReactNode,
		);

		const moduleNames = descriptors.map(
			([name]) => "/" + (clientManifest?.[name]?.file ?? name),
		);

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

		const helmetContext = {};

		const html = (
			<SsrCacheContext.Provider value={cache}>
				<HelmetProvider context={helmetContext}>
					<div id="root">{content}</div>
				</HelmetProvider>
			</SsrCacheContext.Provider>
		);

		const reactStream: ReadableStream & { allReady: Promise<void> } =
			await renderToReadableStream(html, {
				bootstrapModules: ["/" + scriptPath],
			});

		// https://github.com/mahovich/isbot-fast
		// await reactStream.allReady;

		let head = `<!DOCTYPE html><html><head>`;

		const { helmet } = helmetContext as FilledContext;

		head +=
			helmet.base.toString() +
			helmet.link.toString() +
			helmet.meta.toString() +
			helmet.noscript.toString() +
			helmet.script.toString() +
			helmet.style.toString() +
			helmet.title.toString();

		if (import.meta.env.DEV) {
			head +=
				`<script type="module" src="/@vite/client"></script>` +
				`<script type="module" async>${REACT_FAST_REFRESH_PREAMBLE}</script>`;
		}

		head += `<script>$RAKKAS_SSR_CACHE=Object.create(null);$RAKKAS_PAGE_MODULES=${safeStringify(
			moduleNames,
		)}</script>`;

		head += `</head><body>`;

		const textEncoder = new TextEncoder();

		const wrapperStream = new ReadableStream({
			start(controller) {
				controller.enqueue(textEncoder.encode(head));
			},

			async pull(controller) {
				for await (const chunk of reactStream as any as AsyncIterable<Uint8Array>) {
					if (cache._hasNewItems) {
						const newItems = cache._getNewItems();
						const newItemsString = safeStringify(newItems);
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

function safeStringify(obj: any): string {
	// TODO: Escape HTML
	return JSON.stringify(obj);
}

const REACT_FAST_REFRESH_PREAMBLE = `import RefreshRuntime from 'http://localhost:3000/@react-refresh'
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true`;
