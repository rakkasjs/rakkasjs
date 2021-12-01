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

	const prevNext = (
		<nav className={css.prevNext}>
			{prev ? (
				<Link href={"/guide/" + prev.slug}>←&nbsp;{prev.title}</Link>
			) : (
				"\xa0"
			)}

			{next ? (
				<Link href={"/guide/" + next.slug}>{next.title}&nbsp;→</Link>
			) : (
				"\xa0"
			)}
		</nav>
	);

	return (
		<div className={css.wrapper}>
			<Helmet
				title={
					error
						? error.message
						: toc[currentIndex]
						? toc[currentIndex].title + " - Rakkas Guide"
						: "Rakkas Guide"
				}
			/>

			<div className={css.contentWrapper}>
				<div className={css.content}>
					{error ? (
						<h1>{error.message}</h1>
					) : (
						<>
							{prevNext}

							<article>{children}</article>

							{prevNext}
						</>
					)}
				</div>
			</div>

			<div className={css.tocWrapper}>
				<aside className={css.toc}>
					<nav>
						<ul>
							{toc.map((item) => (
								<li key={item.slug}>
									<NavLink
										href={"/guide/" + item.slug}
										currentRouteStyle={{ fontWeight: "bold" }}
										nextRouteStyle={{ color: "#f08" }}
										onCompareUrls={(url, href) =>
											url.pathname === href.pathname
										}
									>
										{item.title}
									</NavLink>
								</li>
							))}
						</ul>
					</nav>
				</aside>
			</div>

			<div className={css.toc2} />
		</div>
	);
};

export default GuideLayout;
