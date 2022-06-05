import React from "react";
import { Redirect } from "rakkasjs";
import { toc } from "./toc";

export default function GuideHomeRedirect() {
	const first = toc[1];
	if (typeof first === "string") {
		throw new Error("Invalid TOC entry");
	}

	return <Redirect href={first.slug} />;
}
