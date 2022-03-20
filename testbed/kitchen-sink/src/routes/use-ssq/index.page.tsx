import { useServerSideQuery } from "rakkasjs";

export default function UseSsq() {
	const a = 2;
	const b = 5;

	const result = useServerSideQuery(() => ({
		result: a + b,
		ssr: import.meta.env.SSR,
	}));

	if (!result.success) {
		return <p>Error</p>;
	}

	return (
		<p>
			Result: {result.value.result}, SSR: {String(result.value.ssr)}
		</p>
	);
}
