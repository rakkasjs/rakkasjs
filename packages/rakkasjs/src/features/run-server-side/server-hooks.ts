import type { ServerHooks } from "../../runtime/hattip-handler";
import { parse } from "@brillout/json-serializer/parse";
import { uneval } from "devalue";
import { decodeFileNameSafe } from "../../runtime/utils";
import renderPageRoute from "../pages/middleware";
import { composableActionData } from "./lib-server";
import { EventStreamContentType } from "@microsoft/fetch-event-source";

const runServerSideServerHooks: ServerHooks = {
	middleware: {
		beforePages: async (ctx) => {
			const prefix = `/_data/`;
			let action = ctx.url.searchParams.get("_action");

			if (!ctx.url.pathname.startsWith(prefix) && !action) {
				return;
			}

			action = action || ctx.url.pathname.slice(prefix.length);
			const [buildId = "", ...rest] = action.split("/");

			let uniqueId: string;
			let moduleId: string;
			let counter: string;
			let closure: string[];

			const manifest = await import(
				"virtual:rakkasjs:run-server-side:manifest"
			);

			if (buildId === "id") {
				[uniqueId, ...closure] = rest;
				const callSiteId = manifest.idMap[uniqueId] || "";
				[moduleId = "", counter = ""] = callSiteId.split("/");
			} else if (buildId !== import.meta.env.RAKKAS_BUILD_ID) {
				// 410 Gone would be more appropriate but it won't work with statically rendered pages
				return new Response("Outdated client", { status: 404 });
			} else {
				[moduleId = "", counter = "", ...closure] = rest;
			}

			let closureContents: unknown[];
			let vars: unknown;
			let isFormMutation = true;

			try {
				if (
					ctx.method === "POST" &&
					ctx.request.headers.get("content-type") === "application/json"
				) {
					isFormMutation = false;
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
						isFormMutation = false;
					}

					closureContents = closure.map((s) => parse(decodeFileNameSafe(s)));
				}
			} catch (e) {
				return new Response("Parse error", { status: 400 });
			}

			const importer = manifest.moduleMap[decodeURIComponent(moduleId)];
			if (!importer) return;

			const module = await importer();
			if (!module.$runServerSide$) return;

			const fn = module.$runServerSide$[Number(counter)];

			const result = await fn(closureContents, ctx, vars);

			if (
				ctx.request.headers.get("accept") === EventStreamContentType &&
				result instanceof ReadableStream
			) {
				const { readable, writable } = new TransformStream<any, string>({
					transform(chunk, controller) {
						controller.enqueue(`data: ${uneval(chunk)}\n\n`);
					},
				});

				ctx.waitUntil(
					result.pipeTo(writable).catch(() => {
						// Ignore
					}),
				);

				return new Response(readable, {
					status: 200,
					headers: {
						"Content-Type": EventStreamContentType,
						"Cache-Control": "no-cache",
						Connection: "keep-alive",
					},
				});
			}

			if (isFormMutation) {
				if (ctx.request.headers.get("accept") === "application/javascript") {
					return new Response(uneval(result));
				} else {
					if (result.redirect) {
						return new Response(null, {
							status: 302,
							headers: {
								location: new URL(result.redirect, ctx.url).href,
							},
						});
					}

					ctx.url.searchParams.delete("_action");
					composableActionData.set(ctx, [action, result]);

					return renderPageRoute(ctx);
				}
			}

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
