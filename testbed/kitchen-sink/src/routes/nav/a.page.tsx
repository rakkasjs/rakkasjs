import { useQuery } from "rakkasjs";

export default function NavHomePAge() {
	useQuery("/nav/a", async () => {
		// Wait 2 seconds
		await new Promise((resolve) => setTimeout(resolve, 500));
	});

	return <p>Client-side navigation test page A</p>;
}
