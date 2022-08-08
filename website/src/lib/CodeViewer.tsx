import { ClientSuspense, useQuery } from "rakkasjs";

export interface CodeViewerProps {
	name: string;
	title: string;
	description: string;
	files: Record<string, string>;
	openFiles?: string[];
	url?: string;
}

export default function CodeViewer(props: CodeViewerProps) {
	return (
		<ClientSuspense
			fallback={
				<div
					style={{
						width: "calc(100vw - 24rem)",
						margin: "2rem 0 2rem calc(-50vw + 12rem + 50%)",
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
						}}
					>
						<div
							style={{
								border: "1px solid #ccc",
								width: "100%",
								maxWidth: "80rem",
								backgroundColor: "#eee",
								height: 600,
							}}
						/>
					</div>
				</div>
			}
		>
			<CodeViewerInner {...props} />
		</ClientSuspense>
	);
}

function CodeViewerInner(props: CodeViewerProps) {
	const { data: element } = useQuery(
		`code-viewer-${props.name}:${JSON.stringify(props.openFiles)}`,
		async () => {
			const { default: Viewer } = await import("./CodeSandboxViewer");
			return <Viewer {...props} />;
		},
	);

	return (
		<div
			style={{
				width: "calc(100vw - 24rem)",
				margin: "2rem 0 2rem calc(-50vw + 12rem + 50%)",
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<div
					style={{
						border: "1px solid #ccc",
						width: "100%",
						maxWidth: "80rem",
						backgroundColor: "#eee",
						height: 600,
					}}
				>
					{element}
				</div>
			</div>
		</div>
	);
}
