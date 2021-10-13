import { Logomark } from "../../lib/Logomark";
import { Logotype } from "../../lib/Logotype";
import React, { FC } from "react";
import css from "./page.module.css";
import { Link } from "rakkasjs";
import { Helmet } from "react-helmet-async";

const HomePage: FC = () => (
	<main className={css.main}>
		<Helmet>
			<title>Rakkas</title>
		</Helmet>

		<div className={css.banner}>
			<div className={css.logo}>
				<Logomark height="120px" />
				<Logotype height="120px" />
			</div>

			<div className={css.tagLine}>
				Lightning fast Next.js alternative powered by Vite
			</div>

			<p>
				<Link href="/guide" className={css.cta}>
					Learn more
				</Link>
			</p>

			<p>
				<a
					href="https://stackblitz.com/edit/rakkas-demo-ts?file=src%2Fpages%2Fpage.tsx"
					target="_blank"
					rel="noreferrer"
				>
					Try it in your browser!
				</a>
			</p>
		</div>

		<div className={css.cards}>
			<div className={css.card}>
				<h4>⚡&nbsp; Lightning fast development</h4>
				<p>Build fast with instant server start and hot module reloading</p>
			</div>
			<div className={css.card}>
				<h4>🖥️&nbsp; Server-side rendering</h4>
				<p>Render the initial page on the sever-side for excellent SEO</p>
			</div>
			<div className={css.card}>
				<h4>📄&nbsp; Static site generation</h4>
				<p>
					Optionally, export a static site that can be hosted on any CDN or
					static server
				</p>
			</div>
			<div className={css.card}>
				<h4>☸️&nbsp; SPA-style navigation</h4>
				<p>Hydrate on the client for fast app-like page transitions</p>
			</div>
			<div className={css.card}>
				<h4>📁&nbsp; File system-based routing</h4>
				<p>Organize your pages and layouts in an intuitive manner</p>
			</div>
			<div className={css.card}>
				<h4>⚙️&nbsp; API routes</h4>
				<p>Build and organize your backend the same way you build your pages</p>
			</div>
		</div>

		<section className={css.dict}>
			<i>Turkish</i> <b lang="tr">rakkas</b> [ɾɑkːˈɑs]{" "}
			<span style={{ display: "inline-block" }}>
				&lt; Arabic <span lang="ar">رقاص</span>
			</span>{" "}
			<div>1. (Male) dancer.</div>
			<div>
				<i>2. (obsolete)</i> Pendulum.
			</div>
		</section>
	</main>
);

export default HomePage;
