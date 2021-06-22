import React, { AnchorHTMLAttributes, CSSProperties, forwardRef } from "react";
import { BaseLink } from "./BaseLink";
import { useRakkas } from "../useRakkas";

export interface NavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	currentRouteClass?: string;
	currentRouteStyle?: CSSProperties;
	nextRouteClass?: string;
	nextRouteStyle?: CSSProperties;
	onCompareUrls?(a: URL, b: URL): boolean;
}

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
		const { navigate, current, next } = useRakkas();

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
