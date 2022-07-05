import { Redirect } from "rakkasjs";
import { toc } from "./toc";

export default function GuideHomeRedirect() {
	const first = toc[0];

	return <Redirect href={"/guide/" + first.slug} />;
}
