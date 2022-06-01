import { useQuery } from "rakkasjs";

export default function NavHomePAge() {
	useQuery("/nav/a", async () => {
		if (import.meta.env.SSR) {
			return;
		}

		await new Promise<void>((resolve) => {
			(window as any).RESOLVE_QUERY = () => {
				resolve();
				delete (window as any).RESOLVE_QUERY;
			};
		});
	});

	return <p>Client-side navigation test page A</p>;
}
