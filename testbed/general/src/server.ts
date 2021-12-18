import { RawRequest, RakkasResponse, RootContext } from "rakkasjs";

export async function servePage(
	req: RawRequest,
	renderPage: (
		request: RawRequest,
		context: RootContext,
	) => Promise<RakkasResponse>,
	locale: string,
): Promise<RakkasResponse> {
	return await renderPage(req, { locale, session: { user: null } });
}
