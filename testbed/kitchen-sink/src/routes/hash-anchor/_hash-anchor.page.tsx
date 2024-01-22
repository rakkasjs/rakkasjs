import { useHead } from "rakkasjs";

export default function HashAnchorPage() {
	useHead({
		// Shorthands for common tags
		title: "...", // <title>...</title>
		description: "...", // <meta name="description" content="...">
		canonical: "...", // <link rel="canonical" href="...">

		// Open Graph shorthands
		"og:title": "...", // <meta property="og:title" content="...">
		"og:description": "...", // <meta property="og:description" content="...">
		"og:url": "...", // <meta property="og:url" content="...">
		"og:image": "...", // <meta property="og:image" content="...">

		// Twitter shorthands
		"twitter:title": "...", // <meta name="twitter:title" content="...">
		"twitter:description": "...", // <meta name="twitter:description" content="...">
		"twitter:image": "...", // <meta name="twitter:image" content="...">
		"twitter:card": "...", // <meta name="twitter:card" content="...">

		// Attributes for <html>, <head> and <body> tags
		htmlAttributes: { lang: "en" }, // <html lang="en">
		headAttributes: { id: "head" }, // <head id="head">
		bodyAttributes: { class: "dark" }, // <body class="dark">

		// Other tags
		elements: [
			// Favicon
			{
				tagName: "link",
				rel: "icon",
				href: "/favicon.ico",
			},
			// Redirect when JavaScript is disabled
			{
				tagName: "noscript",
				children: [
					{
						// tagName: "meta" is the default
						"http-equiv": "refresh",
						content: "0;url=/no-js",
					},
				],
			},
			// Third-party scripts
			{
				tagName: "script",
				src: "https://example.com/script.js",
			},
			// Inline styles
			{
				tagName: "style",
				innerText: "h1 { color: red }",
				media: "print",
			},
		],
	});

	return (
		<div>
			<h1>Hash Anchor Test Page</h1>
			<div style={{ height: "200vh" }}>
				<a href="#hash-anchor">Hash Anchor</a>
			</div>
			<h2 id="hash-anchor">Hash Anchor</h2>
		</div>
	);
}
