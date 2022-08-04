const imports: Record<string, { default: { title: string; date: string } }> =
	import.meta.glob("./*.page.mdx", {
		eager: true,
		as: "frontmatter",
	});

export const toc = Object.entries(imports)
	.sort(
		(a, b) =>
			new Date(b[1].default.date).getTime() -
			new Date(a[1].default.date).getTime(),
	)
	.map(
		([
			slug,
			{
				default: { title, date },
			},
		]) => ({
			slug: slug.slice(2, -9),
			title,
			date: new Date(date).toLocaleDateString(["en-US"], {
				month: "long",
				day: "numeric",
				year: "numeric",
			}),
		}),
	);
