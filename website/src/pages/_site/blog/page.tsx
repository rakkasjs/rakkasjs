import React from "react";
import { definePage, Link } from "rakkasjs";
import { toc } from "./toc";

export default definePage({
	load() {
		return { data: undefined, redirect: toc[0].slug, status: 302 };
	},

	Component: function GuideHomeRedirect() {
		return (
			<p>
				Redirecting to <Link href={toc[0].slug}>{toc[0].title}</Link>
			</p>
		);
	},
});
