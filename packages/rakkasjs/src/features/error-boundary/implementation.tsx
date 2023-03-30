import React, { FC, PropsWithChildren } from "react";
import {
	ErrorBoundaryProps,
	ErrorBoundary as OriginalErrorBoundary,
} from "react-error-boundary";
import { resetErrors } from "../use-query/client-hooks";

/** @see https://github.com/bvaughn/react-error-boundary */
export const ErrorBoundary: FC<PropsWithChildren<ErrorBoundaryProps>> = (
	props,
) => (
	<OriginalErrorBoundary
		{...props}
		onReset={(details) => {
			resetErrors();
			props.onReset?.(details);
		}}
	/>
);
