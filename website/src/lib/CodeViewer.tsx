import { ClientSuspense, useQuery } from "rakkasjs";
import css from "./CodeViewer.module.css";

export interface CodeViewerProps {
	name: string;
	title: string;
	description: string;
	files?: Record<string, string>;
	openFiles?: string[];
	url?: string;
}

export default function CodeViewer(props: CodeViewerProps) {
	return (
		<ClientSuspense
			fallback={
				<div className={css.main}>
					<div className={css.second}>
						<div className={css.third} />
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
		<div className={css.main}>
			<div className={css.second}>
				<div className={css.third}>{element}</div>
			</div>
		</div>
	);
}
