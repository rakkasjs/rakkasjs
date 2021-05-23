import { NavLink } from "@rakkasjs/core";
import React from "react";
import css from "./faq.module.css";

export default ({ children, url, posts }) => (
	<>
		<h1>Frequently Asked Questions</h1>
		{children}

		<aside className={css.sidebar}>
			<nav>
				<ul>
					{posts?.map((post) => (
						<li key={post.slug}>
							<NavLink
								href={`/faq/${post.slug}`}
								currentRouteClass={css.active}
							>
								{post.title}
							</NavLink>
						</li>
					))}
				</ul>
			</nav>
		</aside>
	</>
);

export async function load({ fetch }) {
	return {
		props: { posts: await fetch("/faq-api").then((r) => r.json()) },
	};
}
