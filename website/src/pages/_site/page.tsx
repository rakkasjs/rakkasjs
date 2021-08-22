import { Logomark } from "../../lib/Logomark";
import { Logotype } from "../../lib/Logotype";
import React, { FC } from "react";
import css from "./page.module.css";
import { Link } from "rakkasjs";
import { Helmet } from "react-helmet-async";

const HomePage: FC = () => (
	<>
		<Helmet>
			<title>Rakkas</title>
		</Helmet>

		<div className={css.banner}>
			<div className={css.logo}>
				<Logomark height="100px" />
				<Logotype height="100px" />
			</div>
			<div className={css.tagLine}>The Dancing Web Framework</div>

			<p>
				<Link href="/guide" className={css.cta}>
					Learn more
				</Link>
			</p>

			<p>
				<a
					href="https://stackblitz.com/edit/rakkas-app?file=src%2Fpages%2Fpage.tsx"
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
				<p>
					Build fast with{" "}
					<a href="https://vitejs.dev/" target="_blank" rel="noreferrer">
						Vite
					</a>
					&apos;s instant server restart and hot module reloading with fast
					refresh
				</p>
			</div>
			<div className={css.card}>
				<h4>🖥️&nbsp; Server-side rendering</h4>
				<p>Render the initial page on the sever-side for excellent SEO</p>
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
				<h4>⬇️&nbsp; Easy data fetching</h4>
				<p>
					Use the same code on the server and on the client when fecthing your
					data
				</p>
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
	</>
);

export default HomePage;
