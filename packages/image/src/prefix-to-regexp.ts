export function urlPrefixToRegExp(pattern: string) {
	const parts = pattern.match(
		/^(?<protocol>https?|\*):\/\/(?<domain>(?:\*\*?\.|)(?:[^/]+|\*))(?<path>.*)$/,
	);

	if (!parts) {
		throw new Error(`[@rakkasjs/image] Invalid URL pattern: ${pattern}`);
	}

	const { protocol, domain, path } = parts.groups!;

	const protocolPattern = protocol === "*" ? "https?" : protocol;
	const domainPattern = domain
		.split(".")
		.map((part, i) => {
			if (i === 0) {
				if (part === "*") {
					return "[^.]+";
				}

				if (part === "**") {
					return ".+";
				}
			}

			if (part.includes("*")) {
				throw new Error(
					`[@rakkasjs/image] Subdomain wildcards are only allowed at the beginning of the domain: ${pattern}`,
				);
			}

			return escapeRegExp(part);
		})
		.join("\\.");

	if (path.includes("*")) {
		throw new Error(
			`[@rakkasjs/image] Wildcards are not allowed in the path of URL patterns: ${pattern}`,
		);
	}

	const pathPattern = escapeRegExp(path);

	return new RegExp(
		`^${protocolPattern}://${domainPattern}${pathPattern.replace(/\*$/, ".*")}`,
	);
}

function escapeRegExp(str: string) {
	return str.replace(/[\\^$*+?.()|[\]{}]/g, (x) => `\\${x}`);
}
