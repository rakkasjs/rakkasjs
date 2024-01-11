import { PageProps, useRouteParams } from "rakkasjs";

export default function ParamPage(props: PageProps<{ param: string }>) {
	const params = useRouteParams();

	return (
		<div>
			<h1>Param Page</h1>
			<p id="param">{props.params.param}</p>
			<p id="param2">{params.param}</p>
		</div>
	);
}
