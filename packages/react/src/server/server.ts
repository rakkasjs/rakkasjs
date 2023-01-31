import { RequestContext, RequestHandler } from "@hattip/compose";
import { createElement, ComponentType } from "react";
import { renderToReadableStream } from "react-dom/server.browser";
import { uneval } from "devalue";

export function createRenderer(): RequestHandler {
	return (ctx) => {
		(ctx as any).render = render;
	};
}

interface RenderOptions {
	page: [name: string, module: PageModule];
	layouts: [name: string, module: LayoutModule][];
	clientModuleName: string;
	context: RequestContext;
	devServer: boolean;
}

async function render(options: RenderOptions): Promise<Response> {
	const { layouts, page, clientModuleName } = options;

	const preloadResults = await Promise.all([
		...layouts.map((l) => l[1].preload?.()),
		page[1].preload?.(),
	]);

	const meta = {};
	const headTags = {
		charset: "utf-8",
		viewport: "width=device-width, initial-scale=1",
		title: "Rakkas app",
	};

	for (const result of preloadResults) {
		Object.assign(meta, result?.meta);
		Object.assign(headTags, result?.head);
	}

	const data = preloadResults.map((r) => r?.data);

	const serialized = uneval([(options.context as any).params, meta, ...data]);

	let app = createElement(page[1].default, {
		params: (options.context as any).params,
		meta,
		data: preloadResults[preloadResults.length - 1]?.data,
	});

	for (const [i, layout] of layouts.entries()) {
		if (layout[1].default) {
			app = createElement(
				layout[1].default,
				{
					params: (options.context as any).params,
					meta,
					data: preloadResults[i]?.data,
				},
				app,
			);
		}
	}

	const stream = await renderToReadableStream(app, {
		bootstrapModules: [clientModuleName],
	});

	const htmlAttributes = "";
	const headAttributes = "";
	let headContents = renderHeadTags(headTags);
	const bodyAttributes = "";

	if (options.devServer) {
		headContents +=
			`<script type="module" src="/@vite/client"></script>` +
			`<script type="module" async>${REACT_FAST_REFRESH_PREAMBLE}</script>`;
	}

	// Inject module preload links
	const modules = [...layouts.map((l) => l[0]), page[0]];
	for (const module of modules) {
		headContents += `<link data-route rel="modulepreload" href=${JSON.stringify(
			module,
		)}>`;
	}

	const dataScript = `<script>$RAKKAS_DATA=${serialized}</script>`;

	const pre =
		`<!DOCTYPE html><html${htmlAttributes}>` +
		`<head${headAttributes}>${headContents}${dataScript}</head>` +
		`<body${bodyAttributes}><div id="root">`;
	const post = `</div></body></html>`;

	const transform = new TransformStream({
		start(controller) {
			controller.enqueue(pre);
		},
		transform(chunk, controller) {
			controller.enqueue(chunk);
		},
		flush(controller) {
			controller.enqueue(post);
		},
	});

	stream.pipeThrough(transform);

	return new Response(transform.readable, {
		headers: { "content-type": "text/html; charset=utf-8" },
	});
}

function renderHeadTags(tags: HeadTags): string {
	let result = "";

	for (const [tag, attributes] of Object.entries(tags)) {
		if (typeof attributes === "string") {
			if (tag === "charset") {
				result += `<meta charset="${escapeHtml(attributes)}">`;
			} else if (tag === "title") {
				result += `<title>${escapeHtml(attributes)}</title>`;
			} else if (tag.startsWith("og:")) {
				result += `<meta property="${escapeHtml(tag)}" content="${escapeHtml(
					attributes,
				)}">`;
			} else {
				result += `<meta name="${escapeHtml(tag)}" content="${escapeHtml(
					attributes,
				)}">`;
			}
		} else {
			result += `<${tag}`;
			for (const [attr, value] of Object.entries(attributes)) {
				result += ` ${attr}="${escapeHtml(value)}"`;
			}
			result += ">";
		}
	}

	return result;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;");
}

interface PageModule {
	default: ComponentType<PageProps>;
	preload?(): Awaitable<PreloadResult>;
}

interface PageProps {
	params: Record<string, string>;
	meta: Record<string, unknown>;
	data?: unknown;
}

interface LayoutModule {
	default?: ComponentType<LayoutProps>;
	preload?(): Awaitable<PreloadResult>;
}

interface LayoutProps extends PageProps {
	children?: React.ReactNode;
}

interface PreloadResult {
	data?: unknown;
	meta?: Record<string, unknown>;
	head?: HeadTags;
}

type Awaitable<T> = T | Promise<T>;

type HeadTags = Record<string, string | Record<string, string>>;

const REACT_FAST_REFRESH_PREAMBLE = `import RefreshRuntime from '/@react-refresh'
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true`;
