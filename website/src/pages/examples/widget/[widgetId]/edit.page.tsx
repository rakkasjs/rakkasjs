import React from "react";
import { definePage, DefinePageTypesUnder, Link } from "rakkasjs";
import { WidgetLayoutTypes } from "./layout";

type WidgetEditPageTypes = DefinePageTypesUnder<
	WidgetLayoutTypes,
	{
		params: { widgetId: string };
	}
>;

export default definePage<WidgetEditPageTypes>({
	Component: function WidgetEditPage({ context: { widget } }) {
		return (
			<div>
				<h1>Edit {widget.name}</h1>
				<p>
					<textarea
						defaultValue={widget.description}
						style={{ width: "300px" }}
					/>
				</p>
				<p>OK, it&apos;s not really editable but you get the idea :)</p>
				<p>
					<Link href="./view">View {widget.name}</Link>
				</p>
			</div>
		);
	},
});
