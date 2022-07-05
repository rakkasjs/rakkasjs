import { LayoutProps } from "rakkasjs";
import { toc } from "./toc";
import { TocLayout } from "lib/TocLayout";

export default function GuideLayout({ children, url }: LayoutProps) {
	return (
		<TocLayout url={url} toc={toc} title="Rakkas Guide">
			{children}
		</TocLayout>
	);
}
