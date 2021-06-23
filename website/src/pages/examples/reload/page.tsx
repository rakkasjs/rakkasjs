import React from "react";
import { Page, PageLoadFunc } from "rakkasjs";
import { Helmet } from "react-helmet-async";

export const load: PageLoadFunc = () => {
	return {
		data: Math.floor(1000 * Math.random()),
	};
};

const RandomDataPage: Page = ({ data, reload }) => (
	<div>
		<Helmet title="load and reload Example - Rakkas" />
		<p>
			Data is: <b>{data}</b>.
		</p>
		<button onClick={() => reload()}>Reload</button>
	</div>
);

export default RandomDataPage;
