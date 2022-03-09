import { Context } from "@hattip/core";

export async function hattipHandler(
	req: Request,
	ctx: Context,
): Promise<Response | undefined> {
	const url = new URL(req.url);
	if (url.pathname === "/") {
		return new Response("Hello world!");
	}
}
