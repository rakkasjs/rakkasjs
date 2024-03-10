import { LayoutProps } from "rakkasjs";
import { toc } from "./toc";
import { TocLayout } from "lib/TocLayout";

export default function BlogLayout({ children, url }: LayoutProps) {
	return (
		<TocLayout url={url} toc={toc} title="Rakkas Blog" scrollId="blog">
			{children}
		</TocLayout>
	);
}
