import { toc } from "./toc";
import { Link, Head, LayoutProps } from "rakkasjs";
import css from "./layout.module.css";
import { Toc } from "lib/Toc";

export default function GuideLayout({ children, url }: LayoutProps) {
	const slug = url.pathname.split("/")[2];
	const currentIndex = toc.findIndex((item) => item.slug === slug);
	type TocItem = typeof toc[number] | undefined;
	const current = toc[currentIndex] as TocItem;
	const prev = toc[currentIndex - 1] as TocItem;
	const next = toc[currentIndex + 1] as TocItem;

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
			<Head
				title={current ? current.title + " - Rakkas Guide" : "Rakkas Guide"}
			/>

			<div className={css.contentWrapper}>
				<div className={css.content}>
					{prevNext}

					{current ? (
						<article>
							<h1>{current.title}</h1>
							{children}
						</article>
					) : (
						children
					)}

					{prevNext}
				</div>
			</div>

			<div>
				<aside className={css.toc}>
					<Toc toc={toc} />
				</aside>
			</div>
		</div>
	);
}
