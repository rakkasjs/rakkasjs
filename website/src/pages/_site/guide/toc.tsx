const titles = [
	"What is Rakkas?",
	"Getting started",
	"Migration guide",
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
	"Rendering modes",
	"Environment variables",
	"Deployment targets",
	"Localized routes",
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
