import { RequestHandler } from "@hattip/compose";
import { createElement, ComponentType } from "react";
import { renderToReadableStream } from "react-dom/server.browser";

export function createRenderer(): RequestHandler {
	return (ctx) => {
		(ctx as any).render = render;
	};
}

interface RenderOptions {
	layouts: LayoutModule[];
	page: PageModule;
}

async function render(options: RenderOptions): Promise<Response> {
	const { layouts, page } = options;

	let app = createElement(page.default, {});
	for (const layout of layouts) {
		if (layout.default) {
			app = createElement(layout.default, {}, app);
		}
	}

	const stream = await renderToReadableStream(app);

	const htmlAttributes = "";
	const headAttributes = "";
	const headContents = "";
	const bodyAttributes = "";

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
