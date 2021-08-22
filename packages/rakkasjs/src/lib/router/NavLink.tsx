import React, { AnchorHTMLAttributes, CSSProperties, forwardRef } from "react";
import { BaseLink } from "./BaseLink";
import { useRouter } from "../useRouter";
import { navigate } from "./Router";

export interface NavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	/** Class to be added if `href` matches the current URL */
	currentRouteClass?: string;
	/** Style to be added if `href` matches the current URL */
	currentRouteStyle?: CSSProperties;

	/** Class to be added if `href` matches the next URL, that is, the URL that is loading */
	nextRouteClass?: string;
	/** Style to be added if `href` matches the current URL, that is, the URL that is loading */
	nextRouteStyle?: CSSProperties;

	/**
	 * Custom comparison function for checking if two URLs match
	 * @param url  URL to be compared to `href`
	 * @param href Value of `href` property, passed for convenience
	 *
	 * @returns true if the URL matches `href`
	 */
	onCompareUrls?(url: URL, href: URL): boolean;
}

/**
 * Like {@link Link} but allows adding classes and/or styles based on whether this is the active URL.
 */
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
	(
		{
			currentRouteClass,
			nextRouteClass,
			nextRouteStyle,
			currentRouteStyle,
			onCompareUrls = defaultCompareUrls,
			className,
			style,

			...props
		},
		ref,
	) => {
		const { current, next } = useRouter();

		const classNames = className ? [className] : [];

		if (
			props.href !== undefined &&
			(currentRouteClass ||
				nextRouteClass ||
				currentRouteStyle ||
				nextRouteStyle)
		) {
			const url = new URL(props.href, current);
			if (next && onCompareUrls(next, url)) {
				if (nextRouteClass) classNames.push(nextRouteClass);
				if (nextRouteStyle) style = { ...style, ...nextRouteStyle };
			}

			if (current && onCompareUrls(current, url)) {
				if (currentRouteClass) classNames.push(currentRouteClass);
				if (currentRouteStyle) style = { ...style, ...currentRouteStyle };
			}
		}

		return (
			<BaseLink
				{...props}
				navigate={navigate}
				ref={ref}
				className={classNames.join(" ") || undefined}
				style={style}
			/>
		);
	},
);

NavLink.displayName = "NavLink";

function defaultCompareUrls(a: URL, b: URL) {
	return a.href === b.href;
}
