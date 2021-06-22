import React, { AnchorHTMLAttributes, forwardRef } from "react";

export interface BaseLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	navigate(
		to: string,
		options?: {
			replace?: boolean;
			scroll?: boolean;
		},
	): boolean;
}

export const BaseLink = forwardRef<HTMLAnchorElement, BaseLinkProps>(
	({ navigate, onClick, ...props }, ref) => (
		<a
			{...props}
			ref={ref}
			onClick={(e) => {
				onClick?.(e);
				if (
					e.defaultPrevented ||
					e.currentTarget.href === undefined ||
					e.button !== 0 ||
					e.shiftKey ||
					e.altKey ||
					e.ctrlKey ||
					e.currentTarget.target
				) {
					return;
				}

				navigate(e.currentTarget.href);
				e.preventDefault();
			}}
		/>
	),
);

BaseLink.displayName = "BaseLink";
