const titles = [
	"## Introduction",
	"What is Rakkas?",
	"Getting started",

	"## Basics",
	"Pages and routing",
	"Client-side navigation",
	"Fast refresh",
	"Layouts",
	"Static assets",

	"## Data fetching",
	"useQuery",
	"useServerSideQuery",
	"Refetching",
	"Error handling",

	"## Customization",
	"Configuration",
	"Common hooks",
	"Server-side hooks",
	"Client-side hooks",
	"Environment variables",

	"## Deployment",
	"Node",
	"Static hosting",
	"Cloudflare Workers",
	"Vercel",
	"Netlify",

	"## Advanced",
	"API routes",
	"SEO and rendering modes",
	"Localized routes",

	"## Miscelaneous",
	"Integrations",
	"Feature comparison",
	"Migration guide",
	"Credits",
];

export const toc = titles.map((title) => {
	if (title.startsWith("## ")) {
		return title.slice(3);
	}

	const slug =
		"/guide/" +
		title
			.replace(/([a-z])([A-Z])/g, "$1 $2")
			.split("")
			.map((x) => (x === " " ? "-" : x.toLowerCase()))
			.filter((x) => (x >= "a" && x <= "z") || x === "-")
			.join("");

	return {
		slug,
		title,
	};
});
