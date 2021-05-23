import React from "react";
import { useRef } from "react";
import { useEffect } from "react";

export default ({ post, params, reload }) => {
	// The `load()` function is only called when the page or layout component is mounted. It means that when you navigate directly from `/faq/some-slug` to
	// `/faq/some-other-slug`, load() will not be called. It is our reponsibility to refetch when params.slug changes. Rakkas provides a `reload()` function to
	// solve this for simple cases without duplication of fetch logic.
	const first = useRef(true);
	useEffect(() => {
		// Don't reload on initial render, we're happy with the server-side data.
		if (first.current) {
			first.current = false;
			return;
		}
		console.log("Reloading");

		reload();
	}, [params.slug]);

	return (
		<div>
			<h2>{post.title}</h2>
			<p>{post.content}</p>
		</div>
	);
};

export async function load({ params }) {
	console.log("Loading", params.slug);

	return {
		props: {
			post: await (
				await import("./data.json")
			).default.find((post) => post.slug === params.slug),
		},
	};
}
