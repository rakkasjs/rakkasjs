import { Redirect } from "rakkasjs";
import { toc } from "./toc";

console.log("Coming");

export default function GuideHomeRedirect() {
	const first = toc[0];

	console.log(first);

	return <Redirect href={"/guide/" + first.slug} />;
}
