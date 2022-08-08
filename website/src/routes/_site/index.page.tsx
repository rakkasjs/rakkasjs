import { Logomark } from "lib/Logomark";
import { Logotype } from "lib/Logotype";
import css from "./index.module.css";
import { Link, Head } from "rakkasjs";
import { ExternalIcon } from "lib/ExternalIcon";
import { toc } from "./blog/toc";
import { BlogPostHeader } from "lib/BlogPostHeader";

function HomePage() {
	return (
		<main className={css.main}>
			<Head>
				<title>Rakkas</title>
			</Head>

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
						href="https://codesandbox.io/s/github/rakkasjs/rakkasjs/tree/next/examples/todo?file=/src/routes/index.page.tsx"
						target="_blank"
						rel="noreferrer"
						style={{ marginRight: "2rem" }}
					>
						Try on CodeSandbox
						<ExternalIcon />
					</a>
					<a
						href="https://stackblitz.com/github/rakkasjs/rakkasjs/tree/next/examples/todo?file=src%2Froutes%2Findex.page.tsx"
						target="_blank"
						rel="noreferrer"
					>
						Try on StackBlitz
						<ExternalIcon />
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
					<p>
						Render pages on the sever with streaming support for excellent SEO
					</p>
				</div>
				<div className={css.card}>
					<h4>⬇️&nbsp; API-less data fetching system</h4>
					<p>
						Access your backend directly without having to implement an API
						layer
					</p>
				</div>{" "}
				<div className={css.card}>
					<h4>🚀&nbsp; Deploy anywhere</h4>
					<p>Deploy on Node, Vercel, Netlify, Cloudflare Workers...</p>
				</div>
				<div className={css.card}>
					<h4>📄&nbsp; Static site generation</h4>
					<p>
						Optionally, export a static site that can be hosted on any CDN or
						static server
					</p>
				</div>
				<div className={css.card}>
					<h4>📁&nbsp; File system-based routing</h4>
					<p>
						Organize your pages, layouts, and endpoints in an intuitive manner
					</p>
				</div>
			</div>

			<aside className={css.latestPost}>
				<a href={"/blog/" + toc[0].slug}>
					<p>{toc[0].title}</p>
					<BlogPostHeader date={toc[0].date} />
				</a>
			</aside>

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
}

export default HomePage;
