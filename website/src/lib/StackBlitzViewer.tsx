import { CodeViewerProps } from "lib/CodeViewer";
import { useQuery } from "rakkasjs";
import { Suspense } from "react";

export default function StackBlitzViewer(props: CodeViewerProps) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<StackBlitz {...props} />
		</Suspense>
	);
}

function StackBlitz(props: CodeViewerProps) {
	const { data: sandbox } = useQuery(
		`code-sample-${props.name}:${JSON.stringify(props.openFiles)}`,
		() => {
			if (!props.files) {
				return {
					sandbox_id: `github/rakkasjs/rakkasjs/tree/main/examples/${props.name}`,
				};
			}

			// TODO: Port this to StackBlitz API
			return fetch("https://codesandbox.io/api/v1/sandboxes/define?json=1", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					files: Object.fromEntries(
						Object.keys(props.files).map((x) => [
							x.slice(`../../../../../examples/${props.name}/`.length),
							{ content: props.files![x] },
						]),
					),
					template: "node",
					title: props.title,
					description: props.description,
				}),
			}).then((x) => x.json());
		},
	);

	const file = encodeURIComponent(
		(props.openFiles || ["src/routes/index.page.tsx"]).join(","),
	);

	const path = encodeURIComponent(props.url || "/");

	const url = `https://stackblitz.com//${sandbox.sandbox_id}?file=${file}&initialpath=${path}&embed=1`;

	return (
		<iframe
			src={url}
			style={{
				width: "100%",
				height: "600px",
				overflow: "hidden",
			}}
			sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
		/>
	);
}
