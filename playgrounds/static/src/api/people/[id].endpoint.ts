import { RequestHandler } from "rakkasjs";
import { people } from "./people-data";

export const get: RequestHandler = ({ params }) => {
	const id = Number(params.id);

	const profile = people.find((p) => p.id === id);

	if (!profile) {
		return { status: 404 };
	}

	return {
		body: { profile },
	};
};
