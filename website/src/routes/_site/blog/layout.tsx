import { toc } from "./toc";
import React from "react";
import { Head, Layout, Link } from "rakkasjs";
import css from "./layout.module.css";
import { Toc } from "$lib/Toc";

// TODO: Error handling
const BlogLayout: Layout = ({ children, url }) => {
	const slug = url.pathname.split("/")[2];
	const currentIndex = toc.findIndex((item) => "/blog/" + slug === item.slug);

	const prev = toc[currentIndex - 1];
	const next = toc[currentIndex + 1];

	const prevNext = (
		<nav className={css.prevNext}>
			{prev ? (
				<Link href={prev.slug}>
					←&nbsp;<small>{prev.date}</small>
					<br />
					{prev.title}
				</Link>
			) : (
				"\xa0"
			)}
			{next ? (
				<Link href={next.slug}>
					<small>{next.date}</small>
					<br />
					{next.title}&nbsp;→
				</Link>
			) : (
				"\xa0"
			)}
		</nav>
	);

	return (
		<div className={css.wrapper}>
			<Head
				title={
					toc[currentIndex]
						? toc[currentIndex].title + " - Rakkas Blog"
						: "Rakkas Blog"
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

export default BlogLayout;
