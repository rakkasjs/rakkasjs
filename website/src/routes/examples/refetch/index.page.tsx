import { useQuery, Head } from "rakkasjs";

export default function RandomDataPage() {
	const fetched = useQuery("random", () => Math.floor(1000 * Math.random()));

	return (
		<div>
			<Head title="refetch - Rakkas" />
			<p>
				The following random number will be regenerated every time you click on
				refetch:
			</p>
			<p>
				<b>{fetched.data}</b>
			</p>
			<p>
				<button onClick={() => fetched.refetch()}>Refetch</button>
			</p>
		</div>
	);
}
