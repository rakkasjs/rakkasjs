import type { ServerHooks } from "../../runtime/hattip-handler";
import { parse } from "@brillout/json-s";
import devalue from "devalue";

const runServerSideServerHooks: ServerHooks = {
	middleware: {
		beforeApiRoutes: async (ctx) => {
			// TODO: Build ID
			if (!ctx.url.pathname.startsWith("/_data/development/")) return undefined;

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
					closureContents = closure.map((s) => parse(atob(s)));
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
};

export default runServerSideServerHooks;
