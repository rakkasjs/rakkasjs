import React, { FC, useEffect, useRef, useState } from "react";
import css from "./SampleViewer.module.css";

export interface SampleViewerProps {
	filename?: string;
	code?: string;
	url?: string;
	height?: string | number;
}

const DEFAULT_TITLE = "Rakaks Demo App";

export const SampleViewer: FC<SampleViewerProps> = ({
	filename,
	code,
	url,
	height,
}) => {
	const iframeRef = useRef<HTMLIFrameElement | null>(null);
	const [pageTitle, setPageTitle] = useState(DEFAULT_TITLE);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => {
		if (!iframeRef.current) return;
		const title = iframeRef.current.contentDocument?.title;
		if (title !== pageTitle) setPageTitle(title || DEFAULT_TITLE);
	});

	return (
		<div className={css.wrapper}>
			{filename && (
				<figcaption className={css.filename}>
					<code>{filename}</code>
				</figcaption>
			)}

			{code && (
				<div dangerouslySetInnerHTML={{ __html: code }} className={css.code} />
			)}
			{url && (
				<>
					<figcaption className={css.filename}>
						<code>{pageTitle}</code>
					</figcaption>
					<iframe
						src={url}
						className={css.iframe}
						style={{ height }}
						ref={iframeRef}
					/>

					<p className={css.newTabLink}>
						{url && (
							// eslint-disable-next-line react/jsx-no-target-blank
							<a href={url} target="_blank">
								Open in new tab
							</a>
						)}
					</p>
				</>
			)}
		</div>
	);
};
