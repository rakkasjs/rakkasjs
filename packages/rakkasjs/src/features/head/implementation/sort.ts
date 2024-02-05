import { Attributes, NormalizedHeadProps } from "./merge";

/*
0. charset
1. http-equiv
2. viewport
3. base
4. title
5. link rel=preconnect
6. script async (not module)
7. script type importmap (if there is script async module)
8. script async type module
9. CSS with @import
10. Sync JS
11. Sync CSS
12. link rel=preload
13. script type importmap (if there is no script async module)
14. script defer or type module
15. link rel=prefetch / link rel=preredender
16. Everything else
*/

export function sortHeadTags(tags: NormalizedHeadProps): Array<Attributes> {
	const merged = [...Object.values(tags.keyed), ...tags.unkeyed];

	function rank(tag: Attributes): number {
		switch (tag.tagName) {
			case "meta":
			case undefined:
				if (tag.charset) return 0;
				if (metaEquiv.has(tag["http-equiv"] as any)) return 1;
				if (tag.name === "viewport") return 2;
				return 16;

			case "base":
				return 3;

			case "title":
				return 4;

			case "link":
				if (tag.rel === "preconnect") return 5;
				if (tag.rel === "stylesheet") return 11;
				if (tag.rel === "preload" || tag.rel === "modulepreload") return 12;
				if (tag.rel === "prefetch" || tag.rel === "prerender") return 15;
				return 16;

			case "script":
				if (tag.async && !tag.type) return 6;
				if (tag.type === "importmap") {
					if (merged.some((t) => t.async && t.type === "module")) return 7;
					return 13;
				}
				if (tag.async && tag.type === "module") return 8;
				if (!tag.type) return tag.defer ? 14 : 10;
				if (tag.type === "module") return 14;

				return 16;

			case "style":
				if ((tag.textContent as string | undefined)?.includes("@import"))
					return 9;
				return 11;

			case "noscript":
				return Math.min(
					...(tag.children as any as Array<Attributes>).map(rank),
					16,
				);

			default:
				return 16;
		}
	}

	return merged.sort((a, b) => rank(a) - rank(b));
}

const metaEquiv = new Set([
	"accept-ch",
	"content-security-policy",
	"content-type",
	"default-style",
	"delegate-ch",
	"origin-trial",
	"x-dns-prefetch-control",
]);
