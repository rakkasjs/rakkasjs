import React, { AnchorHTMLAttributes, forwardRef } from "react";
import { BaseLink } from "./BaseLink";
import { navigate } from "./Router";

export const Link = forwardRef<
	HTMLAnchorElement,
	AnchorHTMLAttributes<HTMLAnchorElement>
>((props, ref) => {
	return <BaseLink {...props} navigate={navigate} ref={ref} />;
});

Link.displayName = "Link";
