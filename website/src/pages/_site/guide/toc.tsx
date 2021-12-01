const titles = [
	"What is Rakkas?",
	"Getting started",
	"Pages and routing",
	"Navigation",
	"Layouts",
	"Serving static files",
	"Styling",
	"Data fetching",
	"Layout context",
	"Fast refresh",
	"Refetching data",
	"Error handling",
	"API routes",
	"Load helpers",
	"Customization hooks",
	"Configuration options",
	"Environment variables",
	"Deployment targets",
	"Integrations",
	"Feature comparison",
	"Credits",
];

export const toc = titles.map((title) => {
	const slug = title
		.split("")
		.map((x) => (x === " " ? "-" : x.toLowerCase()))
		.filter((x) => (x >= "a" && x <= "z") || x === "-")
		.join("");

	return {
		slug,
		title,
	};
});
