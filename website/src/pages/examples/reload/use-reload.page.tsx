import React from "react";
import { Page, PageLoadFunc } from "rakkasjs";

export const load: PageLoadFunc = () => {
	return {
		data: Math.floor(1000 * Math.random()),
	};
};

const UseReloadDataPage: Page = ({ data, reload, useReload }) => {
	useReload({
		// Reload when the window comes to foreground
		focus: true,
		// Reload when the internet connection is restored after a disconnection
		reconnect: true,
		// Reload every five seconds
		interval: 5_000,
		// But only if the window is in the foreground
		background: false,
	});

	return (
		<div>
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
};

export default UseReloadDataPage;
