import React, { useEffect, useRef } from "react";
import { defineLayout, DefineLayoutTypes } from "rakkasjs";

type ReloadFocusLayoutTypes = DefineLayoutTypes<{
	data: string;
}>;

let value = "original";

export default defineLayout<ReloadFocusLayoutTypes>({
	load() {
		return { data: value };
	},

	Component: function ReloadFocusLayout({ data, children, reload }) {
		useEffect(() => {
			document.reloadFocusLayout = (v) => {
				value = v;
				reload();
			};
		}, [reload]);

		return (
			<>
				<p>
					Loaded data is: <strong>{data}</strong>.
				</p>
				{children}
			</>
		);
	},
});
