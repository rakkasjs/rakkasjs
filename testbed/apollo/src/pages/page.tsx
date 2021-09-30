import React from "react";
import { definePage, DefinePageTypes } from "rakkasjs";
import { gql, useQuery } from "@apollo/client";

type HomePageTypes = DefinePageTypes<{
	data: { data1: string };
}>;

export default definePage<HomePageTypes>({
	async load({ helpers }) {
		const { data } = await helpers.apolloClient.query({
			query: gql`
				query {
					data1
				}
			`,
		});

		return { data };
	},

	Component: function HomePage({ data: data1 }) {
		const { data: data2 } = useQuery<{ data2: string }>(
			gql`
				query {
					data2
				}
			`,
		);

		const { data: data3 } = useQuery<{ data3: string }>(
			gql`
				query {
					data3
				}
			`,
			{ ssr: false },
		);

		return (
			<>
				<p>
					Data from load function:{" "}
					<strong className="data1">{data1.data1}</strong>.
				</p>
				{data2 && (
					<p>
						Data from useQuery, rendered on the server for the first request:{" "}
						<strong className="data2">{data2.data2}</strong>.
					</p>
				)}
				{data3 && (
					<p>
						Data from useQuery, rendered on the client:{" "}
						<strong className="data3">{data3.data3}</strong>.
					</p>
				)}
			</>
		);
	},
});
