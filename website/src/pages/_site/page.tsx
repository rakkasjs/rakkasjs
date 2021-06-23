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
			<Link href="/docs" className={css.cta}>
				Read the docs
			</Link>
		</div>

		<div className={css.cards}>
			<div className={css.card} style={{ background: "#eef" }}>
				<h3>React</h3>
				<p>Build upon the vast ecosystem of the most popular framework.</p>
			</div>
			<div className={css.card} style={{ background: "#ccd" }}>
				<h3>Vite</h3>
				<p>Enjoy the lightning fast development server.</p>
			</div>
			<div className={css.card} style={{ background: "#dde" }}>
				<h3>Data fetching</h3>
				<p>
					Start building with a simple but effective data fetching solution.
				</p>
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
