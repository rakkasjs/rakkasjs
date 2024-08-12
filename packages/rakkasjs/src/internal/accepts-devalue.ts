import type { RequestContext } from "@hattip/compose";

export function acceptsDevalue(ctx: RequestContext) {
	const accept = ctx.request.headers.get("accept");
	return (
		accept === "text/javascript; devalue" ||
		accept === "text/javascript" ||
		accept === "application/javascript"
	);
}
