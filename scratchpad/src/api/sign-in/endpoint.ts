import { RequestHandler } from "rakkasjs";

export const post: RequestHandler = async (req) => {
	if (!(req.body instanceof URLSearchParams)) {
		return { status: 406 };
	}

	const email = req.body.get("email");
	const password = req.body.get("password");

	if (email !== "admin@example.com" || password !== "topsecret") {
		return { status: 403 };
	}

	return {
		body: { user: { email: "admin@example.com" } },
	};
};
