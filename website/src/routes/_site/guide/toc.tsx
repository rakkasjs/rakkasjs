const titles = [
	"## Introduction",
	"What is Rakkas?",
	"Getting started",

	"## Basics",
	"Pages and routing",
	"Navigation",
	"Layouts",

	"## Data fetching",
	"useQuery",
	"useServerSideQuery",
	"Refetching",
	"Error handling",

	"## Misc",
	"Fast refresh",
	"API routes",
	"Load helpers",
	"Customization hooks",
	"Configuration options",
	"Rendering modes",
	"Environment variables",
	"Deployment targets",
	"Localized routes",
	"Integrations",
	"Feature comparison",
	"Credits",

	"Migration guide",
	"Serving static files",
	"Styling",
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
