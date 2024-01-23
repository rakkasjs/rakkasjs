import type {
	Component,
	ComponentType,
	ErrorInfo,
	FunctionComponent,
	PropsWithChildren,
	ReactElement,
	ReactNode,
} from "react";
export type {
	ErrorBoundaryProps,
	ErrorBoundaryPropsWithComponent,
	ErrorBoundaryPropsWithFallback,
	ErrorBoundaryPropsWithRender,
	FallbackProps,
	UseErrorBoundaryApi,
};

import { useErrorBoundary as originalUseErrorBoundary } from "react-error-boundary";

export { ErrorBoundary } from "./implementation";

export const useErrorBoundary: <TError = any>() => UseErrorBoundaryApi<TError> =
	originalUseErrorBoundary;

// TODO: withErrorBoundary?

type FallbackProps = {
	error: any;
	resetErrorBoundary: (...args: any[]) => void;
};

type ErrorBoundarySharedProps = PropsWithChildren<{
	onError?: (error: Error, info: ErrorInfo) => void;
	onReset?: (
		details:
			| {
					reason: "imperative-api";
					args: any[];
			  }
			| {
					reason: "keys";
					prev: any[] | undefined;
					next: any[] | undefined;
			  },
	) => void;
	resetKeys?: any[];
}>;

type ErrorBoundaryPropsWithComponent = ErrorBoundarySharedProps & {
	fallback?: never;
	FallbackComponent: ComponentType<FallbackProps>;
	fallbackRender?: never;
};

type ErrorBoundaryPropsWithRender = ErrorBoundarySharedProps & {
	fallback?: never;
	FallbackComponent?: never;
	fallbackRender: FallbackRender;
};

type ErrorBoundaryPropsWithFallback = ErrorBoundarySharedProps & {
	fallback: ReactElement<
		unknown,
		string | FunctionComponent | typeof Component
	> | null;
	FallbackComponent?: never;
	fallbackRender?: never;
};

type ErrorBoundaryProps =
	| ErrorBoundaryPropsWithFallback
	| ErrorBoundaryPropsWithComponent
	| ErrorBoundaryPropsWithRender;

type UseErrorBoundaryApi<TError> = {
	resetBoundary: () => void;
	showBoundary: (error: TError) => void;
};

type FallbackRender = (props: FallbackProps) => ReactNode;
