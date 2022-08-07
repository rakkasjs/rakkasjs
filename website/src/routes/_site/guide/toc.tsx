const imports: Record<string, { default: { title: string } }> =
	import.meta.glob("./*.page.mdx", {
		eager: true,
		as: "frontmatter",
	});

const sections: Array<[section: string, slugs: string[]]> = [
	[
		// Section
		"Introduction",
		[
			// Slugs
			"what-is-rakkas",
			"getting-started",
		],
	],
	[
		// Section
		"Basics",
		[
			// Slugs
			"pages-and-basic-routing",
			"client-side-navigation",
			"fast-refresh",
			"layouts",
			"static-assets",
		],
	],
	[
		// Section
		"Data fetching",
		[
			// Slugs
			"use-query",
			"use-server-side-query",
			"refetching",
			"error-handling",
			"preload-function",
		],
	],
	[
		// Section
		"Customization",
		[
			// Slugs
			"configuration",
			"server-side-hooks",
			"client-side-hooks",
			"common-hooks",
			"environment-variables",
		],
	],
	[
		// Section
		"Deployment",
		[
			// Slugs
			"node",
			"static-hosting",
			"cloudflare-workers",
			"vercel",
			"netlify",
		],
	],
	[
		// Section
		"Advanced",
		[
			// Slugs
			"api-routes",
			"route-guards",
			"seo",
			"localized-routes",
		],
	],
	[
		// Section
		"Miscelaneous",
		[
			// Slugs
			"integrations",
			"feature-comparison",
			"migration-guide",
			"credits",
		],
	],
];

export const toc = sections
	.map(([section, slugs]) =>
		slugs.map((slug) => ({
			section,
			slug,
			...imports[`./${slug}.page.mdx`]?.default,
		})),
	)
	.flat()
	.filter((item) => {
		if (import.meta.env.DEV && !item.title) {
			console.warn(`${item.section}: ${item.slug} has no title`);
		}

		return !!item.title;
	});
