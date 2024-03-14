import { Layout, useHead } from "rakkasjs";

const HeadLayout: Layout = ({ children }) => {
	useHead({
		title: "Head layout",
		bodyAttributes: {
			class: "head-layout",
		},
	});

	return children;
};

export default HeadLayout;
