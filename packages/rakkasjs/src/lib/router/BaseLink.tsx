import React, { AnchorHTMLAttributes, forwardRef } from "react";
import { navigate } from "./Router";

export interface BaseLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
	onNavigationStart?(): void;
	onNavigationComplete?(interrupted: boolean): void;
}

export const BaseLink = forwardRef<HTMLAnchorElement, BaseLinkProps>(
	({ onNavigationStart, onNavigationComplete, onClick, ...props }, ref) => (
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

				onNavigationStart?.();

				navigate(e.currentTarget.href)
					.then(() => onNavigationComplete?.(false))
					.catch(() => onNavigationComplete?.(true));

				e.preventDefault();
			}}
		/>
	),
);

BaseLink.displayName = "BaseLink";
