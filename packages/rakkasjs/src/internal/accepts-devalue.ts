import type { RequestContext } from "@hattip/compose";

export function acceptsDevalue(ctx: RequestContext) {
	const accept = ctx.request.headers.get("accept");
	return (
		accept === "text/javascript; devalue" ||
		// It is conceivable that some CDNs may strip the parameter, just to be safe
		accept === "text/javascript" ||
		// TODO: Remove this (kept for backward compatibility)
		accept === "application/javascript"
	);
}
