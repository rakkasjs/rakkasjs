import { RakkasMiddleware, RakkasRequest } from "rakkasjs";
// This is a cookie parsing library available on npm, also install @types/cookie
import cookie from "cookie";

// Define a custom request type
export type RequestWithCookies = RakkasRequest<{
	cookies: Record<string, string>;
}>;

const cookieParserMiddleware: RakkasMiddleware = (request, next) => {
	const cookies = cookie.parse(request.headers.get("cookie") || "");

	return next({
		...request,
		context: { cookies },
	});
};

export default cookieParserMiddleware;
