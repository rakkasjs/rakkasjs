import React from "react";
import { definePage, DefinePageTypes } from "rakkasjs";
import { gql, useQuery } from "@apollo/client";

type HomePageTypes = DefinePageTypes<{
	data: { foo: string };
}>;

export default definePage<HomePageTypes>({
	async load({ helpers }) {
		// You can access the client in your load function
		const { data } = await helpers.apolloClient.query({
			query: gql`
				query {
					foo
				}
			`,
		});

		return { data };
	},

	Component: function HomePage({ data: loadData }) {
		const { data: ssrData } = useQuery<{ bar: string }>(
			gql`
				query {
					bar
				}
			`,
		);

		const { data: clientSideData } = useQuery<{ baz: string }>(
			gql`
				query {
					baz
				}
			`,
			{ ssr: false },
		);

		return (
			<>
				<p>
					Data from load function: <strong>{loadData.foo}</strong>.
				</p>

				{ssrData && (
					<p>
						Data from useQuery, rendered on the server for the first request:{" "}
						<strong>{ssrData.bar}</strong>.
					</p>
				)}

				{clientSideData && (
					<p>
						Data from useQuery, always rendered on the client:{" "}
						<strong>{clientSideData.baz}</strong>.
					</p>
				)}
			</>
		);
	},
});
