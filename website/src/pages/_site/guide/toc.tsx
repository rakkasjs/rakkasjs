const titles = [
	"What is Rakkas?",
	"Getting started",
	"Pages and routing",
	"Static files",
	"Navigation",
	"Layouts",
	"Styling",
	"Data fetching",
	"Layout context",
	"Static site generation",
	"Fast refresh",
	"Refetching data",
	"Error handling",
	"API routes",
	"Load helpers",
	"Customization hooks",
	"Configuration options",
	"Environment variables",
	"Integrations",
	"Roadmap and credits",
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
