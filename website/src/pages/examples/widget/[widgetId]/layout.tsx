import { defineLayout, DefineLayoutTypes } from "rakkasjs";

// Export this definition for use in the child components
export type WidgetLayoutTypes = DefineLayoutTypes<{
	params: { widgetId: string };
	contextOverrides: {
		widget: {
			name: string;
			description: string;
		};
	};
}>;

export default defineLayout<WidgetLayoutTypes>({
	load({ params: { widgetId } }) {
		// Fetch the widget data (we'll just fake it here) and pass it down in the context
		return {
			// We still have to provide a data prop even if we don't need it
			data: undefined,

			context: {
				widget: {
					name: widgetId,
					description: `Description of the widget ${widgetId}`,
				},
			},
		};
	},

	// Don't worry about this for now, we'll explain it later.
	getCacheKey: ({ params: { widgetId } }) => widgetId,

	// We don't have to provide a wrapper component if we don't need to!
});
