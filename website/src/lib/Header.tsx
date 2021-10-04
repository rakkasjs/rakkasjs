import { Logomark } from "./Logomark";
import { Logotype } from "./Logotype";
import { Link, NavLink } from "rakkasjs";
import React, { FC } from "react";
import css from "./Header.module.css";
import { GithubLogo } from "$lib/GithubLogo";

export const Header: FC = () => (
	<header className={css.main}>
		<Link className={css.logo} href="/">
			<Logomark height="2em" />
			<Logotype height="2em" />
		</Link>
		<nav className={css.nav}>
			<ul>
				<li>
					<NavLink
						href="/"
						currentRouteClass={css.activeLink}
						nextRouteClass={css.nextLink}
					>
						Home
					</NavLink>
				</li>
				<li>
					<NavLink
						href="/guide"
						currentRouteClass={css.activeLink}
						nextRouteClass={css.nextLink}
						onCompareUrls={(url) => url.pathname.startsWith("/guide")}
					>
						Guide
					</NavLink>
				</li>
				<li>
					<a
						href="https://github.com/rakkasjs/rakkasjs"
						target="_blank"
						rel="noreferrer"
						title="Github"
					>
						<GithubLogo />
					</a>
				</li>
			</ul>
		</nav>
	</header>
);
