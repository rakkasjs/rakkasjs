import { HeadersFunction } from "rakkasjs";

export default function CustomPage() {
	return <p>Custom Page</p>;
}

export const headers: HeadersFunction = () => ({
	headers: {
		"x-custom-header": "custom",
	},
});
