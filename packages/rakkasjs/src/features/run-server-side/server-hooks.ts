import type { ServerHooks } from "../../runtime/hattip-handler";
import { parse } from "@brillout/json-s";
import devalue from "devalue";

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

			try {
				if (ctx.method === "POST") {
					const text = await ctx.request.text();
					closureContents = parse(text) as unknown[];
					if (!Array.isArray(closureContents)) {
						return new Response("Parse error", { status: 400 });
					}
				} else {
					closure.length = closure.length - 1;
					closureContents = closure.map((s) => parse(decodeBase64(s)));
				}
			} catch (e) {
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
			const result = await fn(closureContents, ctx);

			return new Response(devalue(result));
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

export function decodeBase64(s: string) {
	s = s.replace(/_/g, "/").replace(/-/g, "+");

	if (typeof Buffer !== "undefined") {
		return Buffer.from(s, "base64").toString("utf8");
	} else {
		return atob(s);
	}
}
