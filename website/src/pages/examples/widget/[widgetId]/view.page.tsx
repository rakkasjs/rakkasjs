import React from "react";
import { definePage, DefinePageTypes, LayoutContext, Link } from "rakkasjs";
import { WidgetLayoutTypes } from "./layout";

type WidgetViewPageTypes = DefinePageTypes<{
	params: { widgetId: string };
	// Extract the outgoing context of the widget layout
	parentContext: LayoutContext<WidgetLayoutTypes>;
}>;

export default definePage<WidgetViewPageTypes>({
	Component: function WidgetViewPage({ context: { widget } }) {
		return (
			<div>
				<h1>View {widget.name}</h1>
				<p>{widget.description}</p>
				<p>
					<Link href="./edit">Edit {widget.name}</Link>
				</p>
			</div>
		);
	},
});
