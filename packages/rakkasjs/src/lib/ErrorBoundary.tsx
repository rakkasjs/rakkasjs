import React, { Component } from "react";
import {
	Layout,
	ErrorPage,
	LayoutProps,
	ErrorPageProps,
	ErrorDescription,
} from "./types";
import { toErrorDescription } from "./toErrorDescription";

export function wrapInErrorBoundary(Wrapped: Layout | ErrorPage) {
	return class ErrorBoundary extends Component<
		LayoutProps | ErrorPageProps,
		{ caught: ErrorDescription | null }
	> {
		constructor(props: LayoutProps) {
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
