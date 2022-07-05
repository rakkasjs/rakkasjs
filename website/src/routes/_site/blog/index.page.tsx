import { Redirect } from "rakkasjs";
import { toc } from "./toc";

export default function GuideHomeRedirect() {
	return <Redirect href={"/blog/" + toc[0].slug} />;
}
