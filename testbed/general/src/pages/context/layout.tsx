import React from "react";
import { defineLayout, DefineLayoutTypes, StyledLink } from "rakkasjs";

export type OuterLayoutTypes = DefineLayoutTypes<{
	// eslint-disable-next-line @typescript-eslint/ban-types
	parentContext: {};
	contextOverrides: { outer: string };
}>;

export default defineLayout<OuterLayoutTypes>({
	load() {
		return {
			data: undefined,
			context: { outer: "OUTER" },
		};
	},
	Component: function OuterLayout({ children }) {
		return (
			<>
				<p>
					<StyledLink
						activeStyle={{ background: "#333", color: "#fff" }}
						href="/context/a"
					>
						Go to A
					</StyledLink>{" "}
					&nbsp;{" "}
					<StyledLink
						activeStyle={{ background: "#333", color: "#fff" }}
						href="/context/b"
					>
						Go to B
					</StyledLink>
				</p>
				{children}
			</>
		);
	},
});
