import { StyledLink } from "rakkasjs";
import React from "react";
import css from "./Toc.module.css";

export interface TocProps {
	toc: Array<{ slug: string; title: string; date?: string }>;
}

export function Toc(props: TocProps) {
	const { toc } = props;

	return (
		<nav>
			<ul className={css.list}>
				{toc.map((item) => (
					<li key={item.slug} className={item.date && css.blog}>
						<StyledLink
							href={item.slug}
							className={css.link}
							activeClass={css.active}
							pendingClass={css.pending}
							onCompareUrls={(url, href) => url.pathname === href.pathname}
						>
							{item.date && (
								<>
									<small>{item.date}</small>
									<br />
								</>
							)}
							{item.title}
						</StyledLink>
					</li>
				))}
			</ul>
		</nav>
	);
}
