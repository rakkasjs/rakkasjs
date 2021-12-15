import { RequestHandler } from "rakkasjs";
import { people } from "./people/people-data";

export const get: RequestHandler = () => {
	return {
		body: {
			people: people.map((p) => ({
				id: p.id,
				fullName: p.givenName + " " + p.familyName,
			})),
		},
	};
};
