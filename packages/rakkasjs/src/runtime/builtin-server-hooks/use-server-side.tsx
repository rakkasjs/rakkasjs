import { CreateServerHooksFn } from "../server-hooks";
import { parse } from "@brillout/json-s";
import devalue from "devalue";

const createServerHooks: CreateServerHooksFn = (req, ctx) => {
	return {
		async handleRequest() {
			// TODO: Build ID
			if (!ctx.url.pathname.startsWith("/_data/development/")) return undefined;

			const [, , , moduleId, counter, closure] = ctx.url.pathname
				.split("/")
				.map((s) => decodeURIComponent(s));

			const closureContents = parse(closure);

			const manifest = await import(
				"virtual:rakkasjs:run-server-side:manifest"
			);

			const importer = manifest.default[moduleId];
			if (!importer) return;

			const module = await importer();
			if (!module.$runServerSide$) return;

			const fn = module.$runServerSide$[Number(counter)];

			// TODO: Server-side context
			const result = await fn(closureContents, {});

			return new Response(devalue(result));
		},
	};
};

export default createServerHooks;
