import { PageProps } from "rakkasjs";

export default function SpreadParamPage(props: PageProps<{ rest: string }>) {
	return (
		<div>
			<h1>Spread Param Page</h1>
			<p id="param">{props.params.rest}</p>
		</div>
	);
}
