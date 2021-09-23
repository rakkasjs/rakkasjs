import { RequestHandler } from "rakkasjs";

export const head: RequestHandler = () => {
	return {
		headers: {
			"content-type": "application/json; charset=utf8",
		},
		body: {
			ping: "pong",
		},
	};
};
