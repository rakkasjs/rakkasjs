import { toc } from "./toc";
import React from "react";
import { NavLink, Layout, Link } from "rakkasjs";
import css from "./layout.module.css";
import { Helmet } from "react-helmet-async";

const GuideLayout: Layout = ({ error, children, url }) => {
	const slug = url.pathname.split("/")[2];
	const currentIndex = toc.findIndex((item) => slug === item.slug);

	const prev = toc[currentIndex - 1];
	const next = toc[currentIndex + 1];

	return (
		<div className={css.wrapper}>
			<Helmet
				title={
					(error ? error.message : toc[currentIndex].title) + " - Rakkas Guide"
				}
			/>

			<div className={css.content}>
				<article>{error ? error.message : children}</article>

				<aside>
					<nav className={css.nextPrev}>
						{prev ? (
							<Link href={"/guide/" + prev.slug}>← {prev.title}</Link>
						) : (
							"\xa0"
						)}

						{next ? (
							<Link href={"/guide/" + next.slug}>{next.title} →</Link>
						) : (
							"\xa0"
						)}
					</nav>
				</aside>
			</div>

			<aside className={css.toc}>
				<nav>
					<ul>
						{toc.map((item) => (
							<li key={item.slug}>
								<NavLink
									href={"/guide/" + item.slug}
									currentRouteStyle={{ fontWeight: "bold" }}
									nextRouteStyle={{ color: "#f08" }}
								>
									{item.title}
								</NavLink>
							</li>
						))}
					</ul>
				</nav>
			</aside>
		</div>
	);
};
export default GuideLayout;
