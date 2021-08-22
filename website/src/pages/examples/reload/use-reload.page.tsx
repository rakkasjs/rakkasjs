import React from "react";
import { definePage, DefinePageTypes } from "rakkasjs";
import { Helmet } from "react-helmet-async";

type UseReloadPageTypes = DefinePageTypes<{
	data: number;
}>;

export default definePage<UseReloadPageTypes>({
	load() {
		return {
			data: Math.floor(1000 * Math.random()),
		};
	},

	Component: function UseReloadPage({ data, reload, useReload }) {
		useReload({
			// Reload when the window comes to foreground
			focus: true,
			// Reload when the internet connection is restored after a disconnection
			reconnect: true,
			// Reload every two seconds
			interval: 2_000,
			// But only if the window is in the foreground
			background: false,
		});

		return (
			<div>
				<Helmet title="useReload Example - Rakkas" />
				<p>
					Data is: <b>{data}</b>.
				</p>
				<button
					onClick={() => {
						// Manually force reload
						reload();
					}}
				>
					Reload
				</button>
			</div>
		);
	},
});
