import { RawRequest, RakkasResponse, RootContext } from "rakkasjs";

export async function servePage(
	req: RawRequest,
	renderPage: (
		request: RawRequest,
		context: RootContext,
	) => Promise<RakkasResponse>,
): Promise<RakkasResponse> {
	return await renderPage(req, { session: { user: null } });
}
