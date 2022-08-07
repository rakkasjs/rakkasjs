import { useEffect } from "react";
import sdk from "@stackblitz/sdk";
import { CodeViewerProps } from "lib/CodeViewer";

export default function StackBlitzViewer(props: CodeViewerProps) {
	useEffect(() => {
		const parent = document.getElementById(`code-sample-${props.name}`)!;

		let node = parent.children[0] as HTMLElement;
		if (!node) {
			node = parent.appendChild(document.createElement("div"));
		}

		sdk.embedProject(
			node,
			{
				title: props.title,
				description: props.description,
				template: "node",
				files: Object.fromEntries(
					Object.keys(props.files).map((x) => [
						x.slice(`../../../../../code-samples/${props.name}/`.length),
						props.files[x],
					]),
				),
			},
			{
				openFile: props.openFiles || ["src/routes/index.page.tsx"],
				height: 600,
			},
		);
	}, [
		props.description,
		props.files,
		props.name,
		props.openFiles,
		props.title,
	]);

	return (
		<div
			id={`code-sample-${props.name}`}
			style={{
				border: "1px solid #ccc",
				width: "100%",
				maxWidth: "80rem",
				backgroundColor: "#eee",
				height: 600,
			}}
		/>
	);
}
