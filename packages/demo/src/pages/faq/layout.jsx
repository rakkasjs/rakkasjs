import { NavLink } from "rakkasjs";
import React from "react";
import css from "./faq.module.css";

export default ({ children, data: { posts }, error }) => {
	const content = error ? <p>{error.message}</p> : children;

	return (
		<>
			<h1>Frequently Asked Questions</h1>

			{content}

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
};

export async function load({ fetch }) {
	return {
		data: { posts: await fetch("/faq-api").then((r) => r.json()) },
	};
}
