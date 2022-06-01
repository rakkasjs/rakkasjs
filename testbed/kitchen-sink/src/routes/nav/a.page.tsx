import { useQuery } from "rakkasjs";

export default function NavHomePAge() {
	useQuery("/nav/a", async () => {
		if (import.meta.env.SSR) {
			return;
		}

		await new Promise((resolve) => {
			(window as any).RESOLVE_QUERY = resolve;
		});
	});

	return <p>Client-side navigation test page A</p>;
}
