import React, { createContext } from "react";
import { hattipHandler } from "../hattip-handler";
import { CreateServerHooksFn } from "../server-hooks";

const createServerHooks: CreateServerHooksFn = (request, ctx) => {
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

		let response: Response | undefined;

		if (sameOrigin) {
			response = await hattipHandler(newRequest, {
				ip: ctx.ip,
				waitUntil: ctx.waitUntil,
			});
		}

		return response ?? fetch(newRequest);
	};

	return {
		wrapApp: (app) => (
			<IsomorphicFetchContext.Provider value={{ fetch: ctx.fetch }}>
				{app}
			</IsomorphicFetchContext.Provider>
		),
	};
};

export default createServerHooks;

export const IsomorphicFetchContext = createContext<{ fetch: typeof fetch }>({
	fetch,
});
