import { RequestHandler } from "rakkasjs";

export const post: RequestHandler = ({ body }) => {
	const type =
		body === null || body === undefined
			? JSON.stringify(body)
			: body.constructor.name;

	if (body instanceof URLSearchParams) {
		body = Object.fromEntries((body as URLSearchParams).entries());
	}

	return {
		headers: {
			"content-type": "application/json; charset=utf8",
		},
		body: {
			type,
			value: body,
		},
	};
};
