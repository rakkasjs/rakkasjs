import React from "react";
import { Redirect } from "rakkasjs";
import { toc } from "./toc";

export default function GuideHomeRedirect() {
	return <Redirect href={toc[0].slug} />;
}
