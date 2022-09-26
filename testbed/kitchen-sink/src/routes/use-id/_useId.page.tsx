import { ClientSuspense, Head, Page, useQuery } from "rakkasjs";
import { useId } from "react";

export let uniqueId: string;

const UseIdPage: Page = () => {
	const unique = useId();

	uniqueId = unique;

	return (
		<ClientSuspense fallback="Loading...">
			<Check id={unique} />
		</ClientSuspense>
	);
};

function Check(props: { id: string }) {
	const { data: ssrId } = useQuery("unique-id", (ctx) =>
		ctx.fetch("/use-id/rendered-id").then((res) => res.text()),
	);

	return (
		<p id="useIdTestContainer">{props.id === ssrId ? "Success" : "Fail"}</p>
	);
}

UseIdPage.preload = () => ({
	head: <Head title="useId test" />,
});

export default UseIdPage;
