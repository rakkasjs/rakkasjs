import { Layout, useHead } from "rakkasjs";

const HeadLayout: Layout = ({ children }) => {
	useHead({ title: "Head layout" });

	return children;
};

export default HeadLayout;
