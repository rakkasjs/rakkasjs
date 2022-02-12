import React, { SVGProps } from "react";

export function ExternalIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg width="1em" height="1em" viewBox="0 0 24 24" {...props}>
			<g fill="none">
				<path
					d="M15.64 7.025h-3.622v-2h7v7h-2v-3.55l-4.914 4.914l-1.414-1.414l4.95-4.95z"
					fill="currentColor"
				></path>
				<path
					d="M10.982 6.975h-6v12h12v-6h-2v4h-8v-8h4v-2z"
					fill="currentColor"
				></path>
			</g>
		</svg>
	);
}
