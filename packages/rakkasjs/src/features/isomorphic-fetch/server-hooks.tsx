import React from "react";
import { hattipHandler } from "../../runtime/hattip-handler";
import type { RakkasServerHooks } from "../../runtime/server-hooks";
import { runHandler } from "@hattip/core";
import type { RequestContext } from "../../lib";
import { IsomorphicFetchContext } from "./implementation";

export default function createIsomorphicFetchHooks(
	request: Request,
	ctx: RequestContext<Record<string, string>>,
): RakkasServerHooks {
	ctx.fetch = async (input, init) => {
		let url: URL | undefined;

		if (!(input instanceof Request)) {
			url = new URL(input, ctx.url);
			input = url.href;
		}

		const newRequest = new Request(input, init);
		url = url || new URL(newRequest.url, ctx.url);

		const sameOrigin = url.origin === ctx.url.origin;
		const includeCredentials =
			newRequest.credentials === "include" ||
			(newRequest.credentials === "same-origin" && sameOrigin);

		if (includeCredentials) {
			const cookie = request.headers.get("cookie");
			if (cookie !== null) {
				newRequest.headers.set("cookie", cookie);
			}

			const authorization = request.headers.get("authorization");
			if (authorization !== null) {
				newRequest.headers.set("authorization", authorization);
			}
		} else {
			// Node fetch doesn't honor the credentials property
			newRequest.headers.delete("cookie");
			newRequest.headers.delete("authorization");
		}

		let response: Response | undefined | null;

		if (sameOrigin) {
			response = await runHandler(hattipHandler, newRequest, {
				ip: ctx.ip,
				waitUntil: ctx.waitUntil,
				next: () => fetch(newRequest),
			});
		}

		return response ?? fetch(newRequest);
	};

	return {
		wrapApp: (app) => (
			<IsomorphicFetchContext.Provider value={ctx.fetch}>
				{app}
			</IsomorphicFetchContext.Provider>
		),
	};
}
