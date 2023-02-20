import { useServerSentEvents } from "rakkasjs";

export default function UseSsePage() {
	const out = useServerSentEvents(async () => {
		return new ReadableStream<Date>({
			start(controller) {
				setInterval(() => controller.enqueue(new Date()), 1000);
			},
		});
	});

	console.log(out);

	const { data, dataUpdatedAt } = out;

	return (
		<p>
			Data: {data?.toISOString()}
			<br />
			Updated at: {dataUpdatedAt}
		</p>
	);
}
