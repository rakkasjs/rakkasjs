import { createRequestHandler } from "rakkasjs";
import prepass from "preact-ssr-prepass";
import renderToString from "preact-render-to-string";

export default createRequestHandler({
	createPageHooks() {
		return {
			extendPageContext(ctx) {
				ctx.throttleRenderStream = true;
			},

			async renderToStream(ctx) {
				return new ReadableStream({
					start(controller) {
						prepass(ctx.page as any).then(() => {
							const html =
								renderToString(ctx.page as any) +
								`<script type="module" src=${JSON.stringify(
									ctx.scriptPath,
								)}></script>`;
							controller.enqueue(new TextEncoder().encode(html));
							controller.close();
						});
					},
				});
			},
		};
	},
});
