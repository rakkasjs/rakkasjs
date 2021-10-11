import React from "react";
import { definePage, Link } from "rakkasjs";
import { toc } from "./toc";

export default definePage({
	load() {
		return { location: "/guide/" + toc[0].slug, status: 302 };
	},

	Component: function GuideHomeRedirect() {
		return (
			<p>
				Redirecting to{" "}
				<Link href={"/guide/" + toc[0].slug}>{toc[0].title}</Link>
			</p>
		);
	},
});
