import React from "react";
import { definePage, PageTypes } from "rakkasjs";

interface IndexPageTypes extends PageTypes {
	parentContext: { session: { user: null | { email: string } } };
}

export default definePage<IndexPageTypes>({
	getCacheKey: ({ context }) => context.session,

	load({ context }) {
		console.log("Loading");
		console.log("Context is", context);
		if (!context.session.user) {
			console.log("Redirecting");
			return {
				status: 301,
				location: "/sign-in",
				data: {},
			};
		}

		console.log("Returning");
		return {
			data: {},
		};
	},

	Component: function IndexPage({ context }) {
		return context.session.user ? (
			<p id="greeting">Hello {context.session.user.email}!</p>
		) : (
			<p>Redirecting to login page</p>
		);
	},
});
