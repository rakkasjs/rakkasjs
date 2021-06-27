// This is the main layout of our app. It renders the header and the footer.

import React from "react";
import { Link, NavLink } from "rakkasjs";
import { Helmet } from "react-helmet-async";

// Vite supports CSS modules out of the box!
import css from "./layout.module.css";

export default ({ error, children }) => (
	<>
		{/* Rakkas relies on ract-helmet-async for managing the document head */}
		{/* See their documentation: https://github.com/staylor/react-helmet-async#readme */}
		<Helmet title="Rakkas Demo App" />

		<header className={css.header}>
			{/* <Link /> is like <a /> but it provides client-side navigation without full page reload. */}
			<Link className={css.logo} href="/">
				Rakkas Demo App
			</Link>

			<nav className={css.nav}>
				<ul>
					<li>
						{/* <NavLink /> is like <Link /> but it can be styled based on the current route w(hich is useful for navigation links). */}
						<NavLink href="/" currentRouteClass={css.activeLink}>
							Home
						</NavLink>
					</li>
					<li>
						<NavLink href="/about" currentRouteClass={css.activeLink}>
							About
						</NavLink>
					</li>
					<li>
						<NavLink href="/todo" currentRouteClass={css.activeLink}>
							Todo
						</NavLink>
					</li>
				</ul>
			</nav>
		</header>

		<section className={css.main}>
			{/** Normally layout components are responsible for rendering errors, so we should check if there's an error first */}
			{error ? (
				// Report the error
				<main>
					<h1>{error.message}</h1>
				</main>
			) : (
				// Render the page
				children
			)}
		</section>

		<footer className={css.footer}>
			<p>
				Software and documentation: Copyright 2021 Fatih Aygün. MIT License.
			</p>

			<p>
				Favicon: “Flamenco” by{" "}
				<a href="https://thenounproject.com/term/flamenco/111303/">
					gzz from Noun Project
				</a>{" "}
				(not affiliated).
				<br />
				Used under{" "}
				<a href="https://creativecommons.org/licenses/by/2.0/">
					Creative Commons Attribution Generic license (CCBY)
				</a>
			</p>
		</footer>
	</>
);
