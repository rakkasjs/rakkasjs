const posts = [
	[
		"Rakkas 0.6: Streaming SSR with Suspense and useServerSideQuery",
		// TODO: Set publish date
		"June 24, 2022",
	],
	["Three cool Rakkas features that Next.js lacks", "December 20, 2021"],
	["How to get client-side navigation right", "December 13, 2021"],
	["Rakkas: Next.js alternative powered by Vite", "October 14, 2021"],
];

export const toc = posts.map((post) => {
	const slug =
		"/blog/" +
		post[0]
			.split("")
			.map((x) => (x === " " ? "-" : x.toLowerCase()))
			.filter(
				(x) => (x >= "a" && x <= "z") || (x >= "0" && x <= "9") || x === "-",
			)
			.join("");

	return { slug, title: post[0], date: post[1] };
});
