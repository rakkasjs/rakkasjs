import { RakkasResponse } from "rakkasjs";
import { RequestWithCookies } from "./middleware";

export function get(request: RequestWithCookies): RakkasResponse {
	return {
		// Return the parsed cookies as JSON
		body: { cookies: request.context.cookies },
	};
}
