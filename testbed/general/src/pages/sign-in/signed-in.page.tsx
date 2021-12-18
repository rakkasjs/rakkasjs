import React from "react";
import { definePage, DefinePageTypes } from "rakkasjs";

type IndexPageTypes = DefinePageTypes<{ data: null }>;

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
				data: null,
			};
		}

		console.log("Returning");
		return {
			data: null,
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
