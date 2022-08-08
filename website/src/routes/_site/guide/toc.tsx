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
			"pages-and-basics",
			"dynamic-routes",
			"client-side-navigation",
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
			"loading-state",
			"error-handling",
			"preload-function",
		],
	],
	[
		// Section
		"Data mutations",
		[
			// Slugs
			"using-forms",
			"use-submit",
			"query-invalidation",
			"use-mutation",
		],
	],
	[
		// Section
		"Routing",
		[
			// Slugs
			"404-handling",
			"route-guards",
			"api-routes",
			"api-middleware",
		],
	],
	[
		// Section
		"Customization",
		[
			// Slugs
			"client-entry",
			"hattip-entry",
			"common-hooks",
		],
	],
	[
		// Section
		"SEO",
		[
			// Slugs
			"dynamic-rendering",
			"status-and-headers",
		],
	],
	[
		// Section
		"Advanced",
		[
			// Slugs
			"page-context",
			"client-rendering",
			"static-prerendering",
			"directory-structure",
		],
	],
	[
		// Section
		"Deployment",
		[
			// Slugs
			"node",
			"static-hosts",
			"cloudflare-workers",
			"netlify",
			"vercel",
			"deno",
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
