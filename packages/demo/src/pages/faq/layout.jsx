import { NavLink } from "@rakkasjs/core";
import React from "react";

export default ({ children, posts }) => {
	const currentStyle = {
		background: "#333",
		color: "#eee",
	};

	return (
		<>
			<p>
				This menu is defined in a nested layout. It's common to all /faq/*
				pages.
			</p>
			<nav>
				<ul>
					{posts.map((post) => (
						<li key={post.slug}>
							<NavLink
								href={`/faq/${post.slug}`}
								currentRouteStyle={currentStyle}
							>
								{post.title}
							</NavLink>
						</li>
					))}
				</ul>
			</nav>
			<hr />
			<h1>Frequently Asked Questions</h1>
			{children}
		</>
	);
};

let cache;

export function load() {
	if (cache) return cache;
	return loadAsync();
}

async function loadAsync() {
	cache = {
		props: {
			posts: await (
				await import("./data.json")
			).default.map((post) => ({ slug: post.slug, title: post.title })),
		},
	};

	return cache;
}
