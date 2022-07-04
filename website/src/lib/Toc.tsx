import { StyledLink } from "rakkasjs";
import { Fragment } from "react";
import css from "./Toc.module.css";

export interface TocProps {
	toc: Array<{ section?: string; slug: string; title: string; date?: string }>;
}

export function Toc(props: TocProps) {
	const { toc } = props;
	let lastSection: string | undefined;

	return (
		<nav>
			<ul className={css.list}>
				{toc.map((item) => {
					const section = item.section;
					return (
						<Fragment key={item.slug}>
							{section !== lastSection &&
								((lastSection = section),
								(<li className={css.heading}>{item.section}</li>))}

							<li className={item.date && css.blog}>
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
						</Fragment>
					);
				})}
			</ul>
		</nav>
	);
}
