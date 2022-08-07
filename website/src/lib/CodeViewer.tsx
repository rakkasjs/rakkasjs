import { ClientSuspense, useQuery, useQueryClient } from "rakkasjs";

export interface CodeViewerProps {
	name: string;
	title: string;
	description: string;
	files: Record<string, string>;
	openFiles?: string[];
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
	const { data: viewer } = useQuery("code-viewer-preference", () => {
		try {
			const viewer = localStorage.getItem("code-viewer-preference");
			return viewer === "stackblitz" ? "stackblitz" : "codesandbox";
		} catch {
			return "codesandbox";
		}
	});

	const { data: element } = useQuery(
		`code-viewer-${props.name}-${viewer}`,
		async () => {
			if (viewer === "stackblitz") {
				const { default: Viewer } = await import("./StackBlitzViewer");
				return <Viewer {...props} />;
			} else {
				const { default: Viewer } = await import("./CodeSandboxViewer");
				return <Viewer {...props} />;
			}
		},
	);

	const client = useQueryClient();

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
				<div
					style={{
						width: "100%",
						maxWidth: "80rem",
						textAlign: "right",
					}}
				>
					<button
						type="button"
						onClick={() => {
							localStorage.setItem(
								"code-viewer-preference",
								viewer === "stackblitz" ? "codeSandbox" : "stackblitz",
							);
							client.invalidateQueries((key) => key.startsWith("code-viewer-"));
						}}
					>
						Switch to {viewer === "stackblitz" ? "CodeSandbox" : "StackBlitz"}
					</button>
				</div>
			</div>
		</div>
	);
}
