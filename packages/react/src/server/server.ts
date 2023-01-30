import { RequestHandler } from "@hattip/compose";
import { createElement, ComponentType } from "react";
import { renderToReadableStream } from "react-dom/server.browser";

export function createRenderer(): RequestHandler {
	return (ctx) => {
		(ctx as any).render = render;
	};
}

interface RenderOptions {
	page: [name: string, module: PageModule];
	layouts: [name: string, module: LayoutModule][];
	clientModuleName: string;
}

async function render(options: RenderOptions): Promise<Response> {
	const { layouts, page, clientModuleName } = options;

	let app = createElement(page[1].default, {});
	for (const layout of layouts) {
		if (layout[1].default) {
			app = createElement(layout[1].default, {}, app);
		}
	}

	const stream = await renderToReadableStream(app, {
		bootstrapModules: [clientModuleName],
	});

	const htmlAttributes = "";
	const headAttributes = "";
	let headContents = "";
	const bodyAttributes = "";

	// Inject module preload links
	const modules = [...layouts.map((l) => l[0]), page[0]];
	for (const module of modules) {
		headContents += `<link data-route rel="modulepreload" href=${JSON.stringify(
			module,
		)}>`;
	}

	const pre = `<!DOCTYPE html><html${htmlAttributes}><head${headAttributes}>${headContents}</head><body${bodyAttributes}><div id="root">`;
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

interface PageModule {
	default: ComponentType;
}

interface LayoutModule {
	default?: ComponentType<LayoutProps>;
}

interface LayoutProps {
	children?: React.ReactNode;
}
