export default function ParamPage(props: { params: { param: string } }) {
	return (
		<div>
			<h1>Param Page</h1>
			<p id="param">{props.params.param}</p>
		</div>
	);
}
