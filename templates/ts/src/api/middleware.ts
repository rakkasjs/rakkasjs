import { RakkasMiddleware } from "rakkasjs";

// Middleware to ensure the body type is JSON
const ensureJson: RakkasMiddleware = (req, next) => {
	if (
		req.body &&
		req.body.length &&
		req.headers.get("content-type") !== "application/json"
	) {
		return {
			// Unsupported Media Type
			status: 415,
			body: { error: "Only JSON is accepted" },
		};
	}

	return next(req);
};

export default ensureJson;
