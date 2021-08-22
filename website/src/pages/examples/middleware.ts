import { RakkasMiddleware, RakkasRequest, RakkasResponse } from "rakkasjs";
// This is a cookie parsing library available on npm, also install @types/cookie
import cookie from "cookie";

// Define a custom request type
export type RequestWithCookies = RakkasRequest & {
	context: {
		cookies: Record<string, string>;
	};
};

// Define a custom request handler type
export type RequestWithCookiesHandler = (
	request: RequestWithCookies,
) => RakkasResponse | Promise<RakkasResponse>;

const cookieParserMiddleware: RakkasMiddleware = (request, next) => {
	const cookies = cookie.parse(request.headers.get("cookie") || "");

	return next({
		...request,
		context: { cookies },
	});
};

export default cookieParserMiddleware;
