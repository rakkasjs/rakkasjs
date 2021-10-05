import React, { AnchorHTMLAttributes, forwardRef } from "react";
import { BaseLink } from "./BaseLink";

/**
 * Link component for SPA-style client-side navigation without causing a full page reload.
 * All properties work exactly like the `<a>` element.
 */
export const Link = forwardRef<
	HTMLAnchorElement,
	AnchorHTMLAttributes<HTMLAnchorElement>
>((props, ref) => {
	return <BaseLink {...props} ref={ref} />;
});

Link.displayName = "Link";
