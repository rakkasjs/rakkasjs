import { toc } from "./toc";
import { Head, Layout, Link } from "rakkasjs";
import css from "./layout.module.css";
import { Toc } from "lib/Toc";

const GuideLayout: Layout = ({ children, url }) => {
	const slug = url.pathname.split("/")[2];
	const currentIndex = toc.findIndex((item) => "/guide/" + slug === item.slug);

	const prev = toc[currentIndex - 1];
	const next = toc[currentIndex + 1];

	const prevNext = (
		<nav className={css.prevNext}>
			{prev ? <Link href={prev.slug}>←&nbsp;{prev.title}</Link> : "\xa0"}
			{next ? <Link href={next.slug}>{next.title}&nbsp;→</Link> : "\xa0"}
		</nav>
	);

	return (
		<div className={css.wrapper}>
			<Head
				title={
					toc[currentIndex]
						? toc[currentIndex].title + " - Rakkas Guide"
						: "Rakkas Guide"
				}
			/>

			<div className={css.contentWrapper}>
				<div className={css.content}>
					{prevNext}

					<article>{children}</article>

					{prevNext}
				</div>
			</div>

			<div className={css.tocWrapper}>
				<aside className={css.toc}>
					<Toc toc={toc} />
				</aside>
			</div>
		</div>
	);
};

export default GuideLayout;
