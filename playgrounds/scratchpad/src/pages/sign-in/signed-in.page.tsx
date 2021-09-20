import React from "react";
import { definePage, PageTypes } from "rakkasjs";

interface IndexPageTypes extends PageTypes {
	parentContext: { session: { user: { email: string } } };
}

export default definePage<IndexPageTypes>({
	getCacheKey: ({ context }) => context.session,

	load({ context }) {
		console.log("Loading");
		if (!context.session.user) {
			console.log("Redirecting");
			return {
				status: 301,
				location: "/sign-in",
			};
		}

		console.log("Returning");
		return {
			data: {},
		};
	},

	Component: function IndexPage({ context }) {
		return <p id="greeting">Hello {context.session.user.email}!</p>;
	},
});
