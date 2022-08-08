import { CodeViewerProps } from "lib/CodeViewer";
import { useQuery } from "rakkasjs";
import { Suspense } from "react";

export default function CodeSandboxViewer(props: CodeViewerProps) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<CodeSandbox {...props} />
		</Suspense>
	);
}

function CodeSandbox(props: CodeViewerProps) {
	const { data: sandbox } = useQuery(
		`code-sample-${props.name}:${JSON.stringify(props.openFiles)}`,
		() => {
			if (!props.files) {
				return {
					sandbox_id: `github/rakkasjs/rakkasjs/tree/next/examples/${props.name}`,
				};
			}

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

	return (
		<iframe
			src={`https://codesandbox.io/embed/${sandbox.sandbox_id}?module=${
				(props.openFiles || ["src/routes/index.page.tsx"])
					.map((file) => "/" + file)
					.join(",") + ","
			}&view=split&initialpath=${props.url || "/"}&codemirror=1&fontsize=14`}
			style={{
				width: "100%",
				height: "600px",
				overflow: "hidden",
			}}
			sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
		/>
	);
}
