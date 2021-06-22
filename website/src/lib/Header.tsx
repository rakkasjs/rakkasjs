import { Logomark } from "./Logomark";
import { Logotype } from "./Logotype";
import { Link, NavLink } from "rakkasjs";
import React, { FC } from "react";
import css from "./Header.module.css";

export const Header: FC = () => (
	<header className={css.main}>
		<Link className={css.logo} href="/">
			<Logomark height="2em" />
			<Logotype height="2em" />
		</Link>
		<nav className={css.nav}>
			<ul>
				<li>
					<NavLink href="/" currentRouteClass={css.activeLink}>
						Home
					</NavLink>
				</li>
				<li>
					<NavLink href="/docs" currentRouteClass={css.activeLink}>
						Docs
					</NavLink>
				</li>
				<li>
					<NavLink href="/roadmap" currentRouteClass={css.activeLink}>
						Roadmap
					</NavLink>
				</li>
			</ul>
		</nav>
	</header>
);
