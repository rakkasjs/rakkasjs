import { toc } from "./toc";
import React from "react";
import { Link, Head, LayoutProps } from "rakkasjs";
import css from "./layout.module.css";
import { Toc } from "$lib/Toc";

// TODO: Handle errors

export default function GuideLayout({ children, url }: LayoutProps) {
	const slug = url.pathname.split("/")[2];
	const currentIndex = toc.findIndex(
		(item) => typeof item !== "string" && "/guide/" + slug === item.slug,
	);

	const current = findItem(currentIndex)!;
	const prev = findItem(currentIndex - 1, -1);
	const next = findItem(currentIndex + 1, +1);

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
					toc[currentIndex] ? current.title + " - Rakkas Guide" : "Rakkas Guide"
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
}

function findItem(index: number, direction = 0) {
	const current = toc[index];

	if (typeof current === "string") {
		const next = toc[index + direction];
		if (typeof next === "string") throw new Error("Empty TOC section");
		if (direction === 1) {
			return {
				title: current + ": " + next.title,
				slug: next.slug,
			};
		} else if (direction === -1) {
			let i = index - 1;
			while (typeof toc[i] !== "string") {
				i--;
				if (i < 0) return undefined;
			}
			const title = toc[i];
			return {
				title: title + ": " + next.title,
				slug: next.slug,
			};
		}

		return next;
	} else {
		return current;
	}
}
