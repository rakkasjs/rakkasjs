import { definePage, DefinePageTypes } from "rakkasjs";
import React from "react";
import { Helmet } from "react-helmet-async";
import "./styles.css";

export type IndexPageTypes = DefinePageTypes<never>;

export default definePage<IndexPageTypes>({
	Component: function IndexPage() {
		return (
			<div>
				<Helmet title="Home" />
				<p>Rakkas static site generation demo.</p>
			</div>
		);
	},
});
