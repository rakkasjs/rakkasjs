import React, { AnchorHTMLAttributes, forwardRef } from "react";
import { BaseLink } from "./BaseLink";
import { useRouter } from "./useRouter";

export const Link = forwardRef<
	HTMLAnchorElement,
	AnchorHTMLAttributes<HTMLAnchorElement>
>((props, ref) => {
	const { navigate } = useRouter();

	return <BaseLink {...props} navigate={navigate} ref={ref} />;
});

Link.displayName = "Link";
