export default function SpreadParamPage(props: { params: { rest: string } }) {
	return (
		<div>
			<h1>Spread Param Page</h1>
			<p id="param">{props.params.rest}</p>
		</div>
	);
}
