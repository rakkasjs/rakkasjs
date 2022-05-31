import React, { FC, PropsWithChildren } from "react";
import {
	ErrorBoundaryProps,
	ErrorBoundary as OriginalErrorBoundary,
} from "react-error-boundary";
import { resetErrors } from "../use-query/client-hooks";

export const ErrorBoundary: FC<PropsWithChildren<ErrorBoundaryProps>> = (
	props,
) => (
	<OriginalErrorBoundary
		{...props}
		onReset={() => {
			resetErrors();
			props.onReset?.();
		}}
	/>
);
