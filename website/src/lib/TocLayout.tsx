import { BlogPostHeader } from "lib/BlogPostHeader";
import { Head, Link } from "rakkasjs";
import { Toc } from "./Toc";
import css from "./TocLayout.module.css";

export interface TocItem {
	section?: string;
	slug: string;
	title: string;
	date?: string;
}

export interface TocLayoutProps {
	url: URL;
	toc: TocItem[];
	title: string;
	children: React.ReactNode;
}

export function TocLayout({ url, toc, title, children }: TocLayoutProps) {
	const slug = url.pathname.split("/")[2];
	const currentIndex = toc.findIndex((item) => item.slug === slug);
	type TocItem = typeof toc[number] | undefined;
	const current = toc[currentIndex] as TocItem;
	const prev = current && (toc[currentIndex - 1] as TocItem);
	const next = current && (toc[currentIndex + 1] as TocItem);

	const prevNext = (
		<nav className={css.prevNext}>
			{prev ? (
				<Link href={prev.slug}>
					←&nbsp;
					{prev.section === current?.section
						? prev.title
						: prev.section + ": " + prev.title}
				</Link>
			) : (
				"\xa0"
			)}
			{next ? (
				<Link href={next.slug}>
					{next.section === current?.section
						? next.title
						: next.section + ": " + next.title}
					&nbsp;→
				</Link>
			) : (
				"\xa0"
			)}
		</nav>
	);

	return (
		<div>
			<Head title={current ? current.title + " - " + title : title} />

			<div className={css.contentWrapper}>
				<div className={css.content}>
					{prevNext}

					{current ? (
						<article>
							<h1>{current.title}</h1>
							{current.date && <BlogPostHeader date={current.date} />}
							{children}
						</article>
					) : (
						children
					)}

					{prevNext}
				</div>
			</div>

			<div>
				<aside id="toc" className={css.toc}>
					<Toc toc={toc} />
				</aside>
			</div>
		</div>
	);
}
