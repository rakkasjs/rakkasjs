import React from "react";
import { Link, NavLink, useRouter } from "@rakkasjs/core";
import { Logomark } from "../lib/logomark";
import { Logotype } from "../lib/logotype";
import css from "./main.module.css";

export default ({ error, children }) => {
	const { current } = useRouter();
	const content = error ? <p>{error.message}</p> : children;

	return (
		<>
			<header className={css.header}>
				<div className={css.logo}>
					<Logomark height={"4em"} />
					<Logotype height={"4em"} />
				</div>

				<nav className={css.nav}>
					<ul>
						<li>
							<NavLink href="/" currentRouteClass={css.active}>
								Home
							</NavLink>
						</li>
						<li>
							<Link
								href="/faq"
								className={
									current.pathname === "/faq" ||
									current.pathname.startsWith("/faq/")
										? css.active
										: undefined
								}
							>
								FAQ
							</Link>
						</li>
						<li>
							<NavLink href="/about" currentRouteClass={css.active}>
								About
							</NavLink>
						</li>
						<li>
							<NavLink href="/redirect" currentRouteClass={css.active}>
								Redirect
							</NavLink>
						</li>
						<li>
							<NavLink href="/broken" currentRouteClass={css.active}>
								Broken
							</NavLink>
						</li>
					</ul>
				</nav>
			</header>

			<div className={css.wrapper}>{content}</div>
		</>
	);
};
