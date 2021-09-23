import { RawRequest, RakkasResponse } from "rakkasjs";

export async function servePage(
	req: RawRequest,
	renderPage: (
		request: RawRequest,
		context: Record<string, unknown>,
	) => Promise<RakkasResponse>,
): Promise<RakkasResponse> {
	return await renderPage(req, {
		session: { user: null },
	});
}
