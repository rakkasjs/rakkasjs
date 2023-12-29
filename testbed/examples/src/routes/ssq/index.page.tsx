import { useServerSideQuery } from "rakkasjs";

export default function SsqPage() {
	const ugly = { key: "an interesting value" };

	const { data } = useServerSideQuery(() => ugly.key);

	return <p>Result: {data}</p>;
}
