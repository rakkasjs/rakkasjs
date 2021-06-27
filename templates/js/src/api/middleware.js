// Middleware to ensure the body type is JSON
export default function ensureJson(req, next) {
	if (
		req.body &&
		req.body.length &&
		req.headers.get("content-type") !== "application/json"
	) {
		return {
			status: 406,
			body: {
				error: "Only JSON is accepted",
			},
		};
	}

	return next(req);
}
