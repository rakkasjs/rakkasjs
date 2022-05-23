import React, { FC, useState } from "react";
import css from "./SampleViewer.module.css";

export interface SampleViewerProps {
	filename?: string;
	code?: { file: string; code: string };
	url?: string;
	height?: string | number;
}

const DEFAULT_TITLE = "Rakkas Demo App";

export const SampleViewer: FC<SampleViewerProps> = ({
	filename,
	code: codeObject,
	url,
	height,
}) => {
	const { code, file: realName } = codeObject || {};
	const [pageTitle, setPageTitle] = useState(DEFAULT_TITLE);

	return (
		<div className={css.wrapper}>
			{filename && (
				<figcaption className={css.filename}>
					<code>
						<a
							href={
								"https://github.com/rakkasjs/rakkasjs/blob/main/website/src/pages/examples/" +
								realName
							}
							target="_blank"
							rel="noreferrer"
						>
							{filename}
						</a>
					</code>
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
						onLoad={(e) => {
							setPageTitle(
								(e.currentTarget.contentDocument &&
									e.currentTarget.contentDocument.title) ||
									DEFAULT_TITLE,
							);
						}}
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
