import { RequestWithCookiesHandler } from "./middleware";

export const get: RequestWithCookiesHandler = (request) => {
	return {
		// Return the parsed cookies as JSON
		body: { cookies: request.context.cookies },
	};
};
