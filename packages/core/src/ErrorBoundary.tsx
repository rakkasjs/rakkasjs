import React, { Component, ComponentType } from "react";
import { ErrorHandlerProps } from ".";
import { ErrorDescription } from "../dist";
import { toErrorDescription } from "./toErrorDescription";

export function wrapInErrorBoundary(Wrapped: ComponentType<ErrorHandlerProps>) {
	return class ErrorBoundary extends Component<
		ErrorHandlerProps,
		{ caught: ErrorDescription | null }
	> {
		constructor(props: ErrorHandlerProps) {
			super(props);

			this.state = {
				caught: null,
			};
		}

		componentDidCatch(caught: unknown) {
			this.setState({ caught: toErrorDescription(caught) });
		}

		render() {
			return this.state.caught ? (
				// eslint-disable-next-line react/no-children-prop
				<Wrapped {...this.props} error={this.state.caught}>
					{null}
				</Wrapped>
			) : (
				<Wrapped {...this.props} />
			);
		}
	};
}
