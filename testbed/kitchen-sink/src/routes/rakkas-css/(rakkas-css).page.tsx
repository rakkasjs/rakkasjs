import { useQuery, type Page, ClientOnly, Link } from "rakkasjs";
import { css } from "@rakkasjs/css";
import { Suspense } from "react";

const RakkasCssPage: Page = () => {
	return (
		<>
			<h1 className={css({ color: "red" })}>Hello</h1>
			<ClientOnly fallback={<p>Loading client-only component...</p>}>
				<ClientOnlyComponent />
			</ClientOnly>

			<Suspense fallback={<p>Loading slow component...</p>}>
				<SlowComponent />
			</Suspense>

			<p>
				<Link href="/rakkas-css/elsewhere">Elsewhere</Link>
			</p>
		</>
	);
};

export default RakkasCssPage;

function SlowComponent() {
	useQuery("slow-component", async () => {
		await new Promise((r) => setTimeout(r, 2000));
	});
	return <h2 className={css({ color: "blue" })}>World</h2>;
}

function ClientOnlyComponent() {
	useQuery("client-component", async () => {
		await new Promise((r) => setTimeout(r, 1000));
	});
	return <h2 className={css({ color: "green" })}>Client</h2>;
}
