import type { PageContext } from "../lib";
import { commonHooks } from "../runtime/feature-common-hooks";
import type { PageRouteGuard, Redirection } from "../runtime/page-types";
import { sortHooks } from "../runtime/utils";

export const beforePageLookupHandlers = sortHooks(
	commonHooks.map((hook) => hook.beforePageLookup),
);

export async function findPage<
	T extends
		| (typeof import("rakkasjs:server-page-routes").default)[0]
		| (typeof import("rakkasjs:client-page-routes").default)[0],
>(
	routes: T[],
	url: URL,
	path: string,
	pageContext: PageContext,
	notFound: boolean,
): Promise<RouteMatch<T> | Redirection | undefined> {
	let rewritten: boolean;
	let renderedUrl: URL = url;

	const lookupContext = { ...pageContext, url, renderedUrl };

	if (!notFound) {
		for (const handler of beforePageLookupHandlers) {
			const result = handler(lookupContext);

			if (!result) return undefined;

			if (result === true) continue;

			if ("redirect" in result) {
				const location = String(result.redirect);
				return { redirect: location };
			} else {
				// Rewrite
				renderedUrl = new URL(result.rewrite, renderedUrl);
				path = renderedUrl.pathname;
			}
		}
	}

	do {
		rewritten = false;

		outer: for (const route of routes) {
			const re = route[0];
			const match = path.match(re);
			if (!match) continue;

			const params = unescapeParams(match.groups || {}, route[3]);
			const guardContext = { ...pageContext, url, renderedUrl, params };

			const guards = (route[2] as Array<PageRouteGuard>) || [];

			for (const guard of guards) {
				let result = guard(guardContext);
				if (result instanceof Promise) {
					result = await result;
				}

				if (!result) {
					// Try next match
					continue outer;
				} else if (result === true) {
					// Continue with the next guard
					continue;
				} else if ("rewrite" in result) {
					renderedUrl = new URL(result.rewrite, renderedUrl);
					path = renderedUrl.pathname;

					if (url.href !== renderedUrl.href) {
						rewritten = true;
					}
					// Try again with the new path
					break outer;
				} else {
					return result;
				}
			}

			return {
				route,
				params,
				renderedUrl,
			};
		}
	} while (rewritten);
}

export interface RouteMatch<T> {
	route: T;
	params: Record<string, string>;
	renderedUrl: URL;
}

export function unescapeParams(params: Record<string, string>, rest?: string) {
	for (const [key, value] of Object.entries(params)) {
		if (key === rest) continue;
		params[key] = decodeURIComponent(value);
	}
	return params;
}
