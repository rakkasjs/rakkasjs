import type { ServerHooks } from "../../runtime/hattip-handler";
import { parse } from "@brillout/json-serializer/parse";
import { uneval } from "devalue";
import { decodeFileNameSafe } from "../../runtime/utils";

const runServerSideServerHooks: ServerHooks = {
	middleware: {
		beforeApiRoutes: async (ctx) => {
			if (
				!ctx.url.pathname.startsWith(
					`/_data/${import.meta.env.RAKKAS_BUILD_ID}/`,
				)
			)
				return undefined;

			const [, , , moduleId, counter, ...closure] = ctx.url.pathname.split("/");

			let closureContents: unknown[];
			let vars: unknown;

			try {
				if (
					ctx.method === "POST" &&
					ctx.request.headers.get("content-type") === "application/json"
				) {
					const text = await ctx.request.text();
					const data = parse(text) as [unknown[], unknown];
					if (!Array.isArray(data)) {
						return new Response("Parse error", { status: 400 });
					}
					closureContents = data[0];
					if (!Array.isArray(closureContents)) {
						return new Response("Parse error", { status: 400 });
					}
					vars = data[1];
				} else {
					if (ctx.method === "GET") {
						// Remove path segment /d.js at the end
						closure.length -= 1;
					}

					closureContents = closure.map((s) => parse(decodeFileNameSafe(s)));
				}
			} catch (e) {
				console.error(e);
				return new Response("Parse error", { status: 400 });
			}

			const manifest = await import(
				"virtual:rakkasjs:run-server-side:manifest"
			);

			const importer = manifest.default[decodeURIComponent(moduleId)];
			if (!importer) return;

			const module = await importer();
			if (!module.$runServerSide$) return;

			const fn = module.$runServerSide$[Number(counter)];

			// TODO: Server-side context
			const result = await fn(closureContents, ctx, vars);

			return new Response(uneval(result));
		},
	},
	createPageHooks(requestContext) {
		return {
			extendPageContext(pageContext) {
				pageContext.requestContext = requestContext;
			},
		};
	},
};

export default runServerSideServerHooks;
