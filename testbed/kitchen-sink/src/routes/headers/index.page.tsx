import {
	Page,
	ServerSidePageContext,
	ResponseHeadersProps,
	useQuery,
} from "rakkasjs";
import { Suspense } from "react";

const HeadersPage: Page = () => {
	return (
		<Suspense fallback="Loading">
			<Nested />
		</Suspense>
	);
};

function Nested() {
	const { data } = useQuery("headers", async () => {
		await new Promise<void>((resolve) => setTimeout(resolve, 50));
		return "Some data";
	});

	return <p>Here: {data}</p>;
}

HeadersPage.preload = () => {
	return {
		meta: {
			testData: "1234",
		},
	};
};

export function headers(
	ctx: ServerSidePageContext,
	meta: any,
): ResponseHeadersProps {
	return {
		status: 400,
		headers: {
			"X-Test-1": meta.testData,
			"X-Test-2": ctx.requestContext.request.method,
		},
	};
}

export default HeadersPage;
